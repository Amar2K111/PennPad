import { Extension } from '@tiptap/core'

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style') || null,
            renderHTML: attributes => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        commands.updateAttributes('paragraph', { style: `line-height: ${lineHeight};` })
        return true
      },
    }
  },
}) 