import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'

// Shared between the live PlainSlideEditor (useEditor) and the read-only
// RichContentView (generateHTML) — both must use the exact same extension
// set so a stored document always renders identically in both places.
export const richTextExtensions = [
  StarterKit,
  TextStyle,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
]
