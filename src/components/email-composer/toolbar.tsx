"use client";

import { type Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Heading2,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Variable,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Paperclip,
    Image as ImageIcon,
    RemoveFormatting,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ToolbarVariable {
    key: string;
    label: string;
    isCustom?: boolean; // false for standard fields, true for dynamic/custom ones
}

interface ToolbarProps {
    editor: Editor | null;
    onAttach?: () => void;
    onImage?: () => void;
    variables?: ToolbarVariable[];
}

export function Toolbar({ editor, onAttach, onImage, variables = [] }: ToolbarProps) {
    if (!editor) return null;

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        action();
    };

    const TooltipWrapper = ({ children, content }: { children: React.ReactNode; content: string }) => (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>{content}</TooltipContent>
        </Tooltip>
    );

    const toggleHeading = (e: React.MouseEvent) => {
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 2 }).run();
    };

    const toggleBulletList = (e: React.MouseEvent) => {
        e.preventDefault();
        editor.chain().focus().toggleBulletList().run();
    };

    const toggleOrderedList = (e: React.MouseEvent) => {
        e.preventDefault();
        editor.chain().focus().toggleOrderedList().run();
    };

    const toggleBlockquote = (e: React.MouseEvent) => {
        e.preventDefault();
        editor.chain().focus().toggleBlockquote().run();
    };

    return (
        <TooltipProvider>
            <div className="bg-transparent rounded-t-md p-1 flex flex-wrap gap-1 items-center">
                {/* ... existing Bold/Italic ... skipping for brevity in replacement if possible, but I need to target the block */}
                <TooltipWrapper content="Bold">
                    <Button
                        variant={editor.isActive("bold") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().toggleBold().run())}
                        type="button"
                        aria-label="Toggle bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Italic">
                    <Button
                        variant={editor.isActive("italic") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().toggleItalic().run())}
                        type="button"
                        aria-label="Toggle italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Strikethrough">
                    <Button
                        variant={editor.isActive("strike") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().toggleStrike().run())}
                        type="button"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Subscript">
                    <Button
                        variant={editor.isActive("subscript") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().toggleSubscript().run())}
                        type="button"
                    >
                        <SubscriptIcon className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Superscript">
                    <Button
                        variant={editor.isActive("superscript") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().toggleSuperscript().run())}
                        type="button"
                    >
                        <SuperscriptIcon className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                {/* Alignment Group */}
                <div className="w-px h-6 bg-border mx-1" />

                <TooltipWrapper content="Align Left">
                    <Button
                        variant={editor.isActive({ textAlign: 'left' }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().setTextAlign('left').run())}
                        type="button"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Align Center">
                    <Button
                        variant={editor.isActive({ textAlign: 'center' }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().setTextAlign('center').run())}
                        type="button"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Align Right">
                    <Button
                        variant={editor.isActive({ textAlign: 'right' }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().setTextAlign('right').run())}
                        type="button"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <div className="w-px h-6 bg-border mx-1" />

                <TooltipWrapper content="Heading 2">
                    <Button
                        variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleHeading}
                        type="button"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Bullet List">
                    <Button
                        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleBulletList}
                        type="button"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Ordered List">
                    <Button
                        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleOrderedList}
                        type="button"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Blockquote">
                    <Button
                        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleBlockquote}
                        type="button"
                    >
                        <Quote className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Insert Group */}
                <TooltipWrapper content="Insert Link">
                    <Button
                        variant={editor.isActive("link") ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => {
                            const previousUrl = editor.getAttributes('link').href;
                            let url = window.prompt('URL', previousUrl);
                            if (url === null) return;
                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }

                            // Add https:// if no protocol is present
                            if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
                                url = 'https://' + url;
                            }

                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        })}
                        type="button"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Insert Image">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => {
                            if (onImage) {
                                onImage();
                            } else {
                                const url = window.prompt('Image URL');
                                if (url) {
                                    editor.chain().focus().setImage({ src: url }).run();
                                }
                            }
                        })}
                        type="button"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Attach File">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => onAttach && onAttach())}
                        type="button"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <DropdownMenu>
                    <TooltipWrapper content="Insert Variable">
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700" type="button">
                                <Variable className="h-4 w-4 mr-1" /> Variables
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipWrapper>
                    <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                        {variables.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">No variables available</div>
                        ) : (
                            <>
                                <DropdownMenuLabel>Standard</DropdownMenuLabel>
                                {variables.filter(v => !v.isCustom).map(v => (
                                    <DropdownMenuItem key={v.key} onClick={() => editor.chain().focus().insertContent(`{{${v.key}}}`).run()}>
                                        {v.label}
                                    </DropdownMenuItem>
                                ))}

                                {variables.some(v => v.isCustom) && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Custom</DropdownMenuLabel>
                                        {variables.filter(v => v.isCustom).map(v => (
                                            <DropdownMenuItem key={v.key} onClick={() => editor.chain().focus().insertContent(`{{${v.key}}}`).run()}>
                                                {v.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-muted-foreground italic cursor-pointer gap-2"
                            onClick={() => {
                                const name = window.prompt("Enter variable name (e.g. discount_code):");
                                if (name) {
                                    // Strip braces if user typed them, replace spaces with underscores
                                    const cleanName = name.replace(/[{}]/g, '').trim().replace(/\s+/g, '_');
                                    editor.chain().focus().insertContent(`{{${cleanName}}}`).run();
                                }
                            }}
                        >
                            <Plus className="h-3 w-3" /> Add new variable...
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />

                <TooltipWrapper content="Clear Formatting">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().unsetAllMarks().clearNodes().run())}
                        type="button"
                    >
                        <RemoveFormatting className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Undo">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().undo().run())}
                        disabled={!editor.can().undo()}
                        type="button"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper content="Redo">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleAction(e, () => editor.chain().focus().redo().run())}
                        disabled={!editor.can().redo()}
                        type="button"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </TooltipWrapper>
            </div>
        </TooltipProvider>
    );
}
