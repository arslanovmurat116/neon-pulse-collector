import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";
import { translate } from "@/i18n";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#0a0e27" />
          <meta name="description" content={translate("en", "app.metaDescription")} />
          <link
            rel="icon"
            type="image/svg+xml"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🟢</text></svg>"
          />
        </Head>
        <body className="bg-neon-dark text-neon-green">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
