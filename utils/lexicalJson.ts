/**
 * Convert plain text to Lexical editor state JSON string (single paragraph).
 * Use this for seeding clause template content so the UI can load it in ClauseLexicalEditor.
 */
export function plainTextToLexicalJson(plainText: string): string {
  const root = {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: plainText,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
  return JSON.stringify(root);
}
