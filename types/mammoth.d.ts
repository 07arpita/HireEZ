declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  interface Options {
    arrayBuffer?: ArrayBuffer;
    styleMap?: string;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    idPrefix?: string;
    transformDocument?: (document: any) => any;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
    convertImage?: (image: any) => Promise<any>;
  }

  export function extractRawText(options: Options): Promise<ExtractResult>;
  export function convertToHtml(options: Options): Promise<ExtractResult>;
  export function convertToMarkdown(options: Options): Promise<ExtractResult>;
  export function images(options: Options): Promise<ExtractResult>;
  export function extractRawText({ arrayBuffer }: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
} 