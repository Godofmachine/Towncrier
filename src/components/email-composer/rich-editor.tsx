import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Toolbar, type ToolbarVariable } from "./toolbar";
import { AiAssistant } from "./ai-assistant";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface RichEditorProps {
    content: string;
    onChange: (content: string) => void;
    onSubjectGenerate?: (subject: string) => void;
    onAttach?: () => void;
    onImage?: () => void;
    variables?: ToolbarVariable[];
}

export function RichEditor({ content, onChange, onSubjectGenerate, onAttach, onImage, variables }: RichEditorProps) {
    const [showAi, setShowAi] = useState(true);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder: "Write your email content here...",
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 hover:underline cursor-pointer',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image,
            Subscript,
            Superscript,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: "min-h-[400px] w-full rounded-b-md bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose max-w-none dark:prose-invert"
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Sync content updates from parent if needed (optional, depends on use case, but good for stability)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if difference is significant to avoid cursor jumps, 
            // but for now let's rely on initial content and simple updates.
            // editor.commands.setContent(content); 
        }
    }, [content, editor]);

    const handleAiInsert = (newContent: string) => {
        editor?.commands.insertContent(newContent);
    };

    return (
        <div className="flex h-[600px] border rounded-md overflow-hidden bg-background">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-center bg-muted/20 pr-2">
                    <Toolbar editor={editor} onAttach={onAttach} onImage={onImage} variables={variables} />
                    {!showAi && (
                        <Button variant="ghost" size="sm" onClick={() => setShowAi(true)} className="text-purple-600" type="button">
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Assistant
                        </Button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    <EditorContent editor={editor} />
                </div>
            </div>

            {showAi && (
                <div className="relative border-l">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-6 w-6"
                        onClick={() => setShowAi(false)}
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <AiAssistant onInsert={handleAiInsert} onSubjectGenerate={onSubjectGenerate} />
                </div>
            )}
        </div>
    );
}
