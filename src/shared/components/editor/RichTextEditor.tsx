import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import { AuthImageNode } from "./AuthImageNode";
import {
  ImagePickerDialog,
  IMAGE_MIME,
  MAX_IMAGE_BYTES,
} from "./ImagePickerDialog";
import { useUploadFile } from "@/shared/hooks/file/useUploadFile";
import { FilePurposeEnum } from "@/shared/enums/file/file-storage.enum";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  className?: string;
  /** Có giá trị → picker bật thêm tab "Ảnh từ chat" của ticket này. */
  ticketId?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("size-8 p-0", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

function Toolbar({
  editor,
  disabled,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  disabled?: boolean;
  onPickImage: () => void;
  uploading?: boolean;
}) {
  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập URL liên kết", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  };

  return (
    <div className="border-input flex flex-wrap items-center gap-0.5 border-b p-1">
      <ToolbarButton
        label="Đậm"
        disabled={disabled}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Nghiêng"
        disabled={disabled}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch ngang"
        disabled={disabled}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        label="Tiêu đề 2"
        disabled={disabled}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Tiêu đề 3"
        disabled={disabled}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        label="Danh sách"
        disabled={disabled}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách đánh số"
        disabled={disabled}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Trích dẫn"
        disabled={disabled}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Khối mã"
        disabled={disabled}
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        label="Liên kết"
        disabled={disabled}
        active={editor.isActive("link")}
        onClick={promptLink}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Chèn ảnh"
        disabled={disabled || uploading}
        onClick={onPickImage}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImageIcon className="size-4" />
        )}
      </ToolbarButton>

      <span className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        label="Hoàn tác"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Làm lại"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Editor WYSIWYG dùng chung cho Blog (`contentHtml`) và Knowledge Base
 * (`symptoms` / `diagnosisSteps` / `solutionSteps`).
 * Bind vào React Hook Form qua `Controller` — nhận `value`, gọi `onChange(html)`.
 *
 * `@tiptap/extension-link` đã nằm sẵn trong StarterKit v3, không cần cài riêng.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  className,
  ticketId,
}: RichTextEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { mutateAsync: uploadFile, isPending: uploading } = useUploadFile();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      AuthImageNode,
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          "rich-content min-h-[240px] w-full px-3 py-2 text-sm leading-relaxed focus:outline-none",
      },
    },
  });

  // Đồng bộ khi form reset() nạp dữ liệu từ server sau lúc editor đã mount
  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Upload ảnh → chèn node lưu fileId (không nhúng base64 vào nội dung)
  const insertImages = useCallback(
    async (files: File[]) => {
      if (!editor) return;
      for (const file of files) {
        if (!IMAGE_MIME.test(file.type)) {
          toast.error(
            `"${file.name}" không phải ảnh hợp lệ (png/jpg/gif/webp)`,
          );
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`"${file.name}" vượt quá 5MB`);
          continue;
        }
        try {
          const res = await uploadFile({
            file,
            folderName: "kb-blog",
            purpose: FilePurposeEnum.KbImage,
          });
          const fileId = res.data?.fileId;
          if (!fileId) {
            toast.error(`Tải "${file.name}" thất bại`);
            continue;
          }
          editor.chain().focus().setAuthImage({ fileId, alt: file.name }).run();
        } catch {
          toast.error(`Tải "${file.name}" thất bại`);
        }
      }
    },
    [editor, uploadFile],
  );

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border-input bg-background overflow-hidden rounded-md border",
        disabled && "opacity-60",
        className,
      )}
      onDrop={(e) => {
        if (disabled) return;
        const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
          IMAGE_MIME.test(f.type),
        );
        if (files.length === 0) return;
        e.preventDefault();
        void insertImages(files);
      }}
      onDragOver={(e) => {
        if (!disabled && e.dataTransfer?.types?.includes("Files"))
          e.preventDefault();
      }}
      onPaste={(e) => {
        if (disabled) return;
        const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
          IMAGE_MIME.test(f.type),
        );
        if (files.length === 0) return;
        e.preventDefault();
        void insertImages(files);
      }}
    >
      <Toolbar
        editor={editor}
        disabled={disabled}
        uploading={uploading}
        onPickImage={() => setPickerOpen(true)}
      />
      <EditorContent editor={editor} />
      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        ticketId={ticketId}
        onPick={(fileId, alt) =>
          editor.chain().focus().setAuthImage({ fileId, alt }).run()
        }
      />
    </div>
  );
}
