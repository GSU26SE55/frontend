import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AuthImageView } from "./AuthImageView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    authImage: {
      /** Chèn ảnh đã upload — lưu fileId, KHÔNG lưu blob/base64 vào HTML. */
      setAuthImage: (attrs: { fileId: string; alt?: string }) => ReturnType;
    };
  }
}

/**
 * Ảnh trong rich text, lưu dưới dạng `<img data-file-id="...">`.
 *
 * Vì file trong hệ thống cần Bearer token, `<img src="/api/files/{id}/download">`
 * đặt thẳng vào HTML sẽ trả 401. Node này chỉ lưu `fileId` vào HTML; lúc hiển thị
 * mới tải blob qua axios rồi gán `src` (giống `AuthImage`).
 *
 * KHÔNG dùng base64: nội dung sẽ phình vào mọi response list/detail.
 */
export const AuthImageNode = Node.create({
  name: "authImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fileId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-file-id"),
        renderHTML: (attrs) =>
          attrs.fileId ? { "data-file-id": attrs.fileId as string } : {},
      },
      alt: {
        default: "",
        parseHTML: (el) => el.getAttribute("alt"),
        renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt as string } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-file-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // src để trống — viewer tự nạp blob theo data-file-id
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AuthImageView);
  },

  addCommands() {
    return {
      setAuthImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
