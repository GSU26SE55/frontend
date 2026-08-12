import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AuthImageView } from "./AuthImageView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    authImage: {
      /** Inserts an uploaded image — stores fileId, does NOT store a blob/base64 in the HTML. */
      setAuthImage: (attrs: { fileId: string; alt?: string }) => ReturnType;
    };
  }
}

/**
 * Image inside rich text, stored as `<img data-file-id="...">`.
 *
 * Since files in the system require a Bearer token, an `<img src="/api/files/{id}/download">`
 * placed directly in the HTML would get a 401. This node only stores `fileId` in the
 * HTML; the blob is loaded via axios and assigned to `src` at render time (same as `AuthImage`).
 *
 * Does NOT use base64: the content would bloat every list/detail response.
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
    // src left empty — the viewer loads the blob from data-file-id itself
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
