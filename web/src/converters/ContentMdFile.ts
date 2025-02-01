import matter from "gray-matter";
import { CardStoredMetadata } from "../dataTypes/CardMetadata";

export class ContentMdFile {

    private markdownContent: string;
    private properties: { [key: string]: unknown };

    constructor(rawFileContent: string) {
        const parsedFile = matter(rawFileContent);

        this.markdownContent = parsedFile.content;
        this.properties = parsedFile.data;
    }

    getJustMarkdownContent() {
        return this.markdownContent;
    }

    setJustMarkdownContent(content: string) {
        this.markdownContent = content;
    }

    updatePropertiesWithMetadata(cardMetadata: CardStoredMetadata){
        this.properties["title"] = cardMetadata.title;
        this.properties["aliases"] = [
            "content",
            cardMetadata.title
        ]
        this.properties["tags"] = [
            "2dTaskBoardAppTask"
        ]
    }

    getRawContentMdFileReadyToSave(cardMetadata: CardStoredMetadata) {
        this.updatePropertiesWithMetadata(cardMetadata);

        return matter.stringify(this.markdownContent, this.properties);
    }
}