import Papa from "papaparse";

export interface ParsedContact {
    email: string;
    first_name?: string;
    last_name?: string;
    custom_fields: Record<string, string>;
}

export interface ParseResult {
    contacts: ParsedContact[];
    errors: string[];
    skipped: number;
    totalRows: number;
}

export const parseCSV = (file: File): Promise<ParseResult> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const contacts: ParsedContact[] = [];
                const errors: string[] = [];
                let skipped = 0;

                results.data.forEach((row: any, index) => {
                    // 1. Identify Email Column (case insensitive)
                    const emailKey = Object.keys(row).find(
                        (key) => key.toLowerCase() === "email" || key.toLowerCase() === "e-mail"
                    );

                    if (!emailKey || !row[emailKey]) {
                        skipped++;
                        errors.push(`Row ${index + 2}: Missing email address`);
                        return;
                    }

                    const email = row[emailKey].trim();

                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        skipped++;
                        errors.push(`Row ${index + 2}: Invalid email format (${email})`);
                        return;
                    }

                    // 2. Extract Standard Fields
                    const firstNameKey = Object.keys(row).find(k =>
                        k.toLowerCase().replace(/[^a-z]/g, '') === "firstname" ||
                        k.toLowerCase() === "first name" ||
                        k.toLowerCase() === "name"
                    );

                    const lastNameKey = Object.keys(row).find(k =>
                        k.toLowerCase().replace(/[^a-z]/g, '') === "lastname" ||
                        k.toLowerCase() === "last name"
                    );

                    // 3. Extract Custom Fields (everything else)
                    const custom_fields: Record<string, string> = {};
                    Object.keys(row).forEach((key) => {
                        if (
                            key !== emailKey &&
                            key !== firstNameKey &&
                            key !== lastNameKey
                        ) {
                            const cleanedKey = key.toLowerCase().replace(/\s+/g, "_");
                            if (row[key]) {
                                custom_fields[cleanedKey] = row[key].toString().trim();
                            }
                        }
                    });

                    // 4. Duplicate Check (within file)
                    if (contacts.some(c => c.email === email)) {
                        skipped++;
                        errors.push(`Row ${index + 2}: Duplicate email in file (${email})`);
                        return;
                    }

                    contacts.push({
                        email,
                        first_name: firstNameKey ? row[firstNameKey]?.trim() : undefined,
                        last_name: lastNameKey ? row[lastNameKey]?.trim() : undefined,
                        custom_fields,
                    });
                });

                resolve({
                    contacts,
                    errors,
                    skipped,
                    totalRows: results.data.length,
                });
            },
            error: (error) => {
                resolve({
                    contacts: [],
                    errors: [`File read error: ${error.message}`],
                    skipped: 0,
                    totalRows: 0,
                });
            },
        });
    });
};
