export class SlugUtil {
  static generate(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateUnique(text: string): string {
    const slug = this.generate(text);
    const timestamp = Date.now().toString(36);
    return `${slug}-${timestamp}`;
  }
}