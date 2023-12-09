import json
import os
import re

import pdfplumber

dataDir = "../data/"
dataName = "Deep Learning.pdf"


class Book:
    num_pages = -1
    book_end_page = "735"
    page_offset = 15

    def __init__(self, name=dataName, dataDir=dataDir):
        self.name = name
        self.dataDir = dataDir
        self.pdf = self.loader()

    def loader(self):
        print("Reading book: ", self.name, "from directory: ", self.dataDir)
        try:
            pdf = pdfplumber.open(os.path.join(self.dataDir, self.name))
        except:
            print("Error: File not found")
            return None
        self.num_pages = len(pdf.pages)
        print("Book loaded successfully")
        print("Number of pages: ", self.num_pages)
        return pdf

    def close(self):
        self.pdf.close()

    def readPage(self, page=-1):
        if page == -1:
            return self.pdf.pages
        else:
            return self.pdf.pages[page - 1]

    def readPageInInterval(self, start_page, end_page, offset=page_offset):
        return self.pdf.pages[start_page - 1 + offset : end_page - 1 + offset]

    def searchStrInPage(self, page, str):
        page_text = self.readPage(page)
        return page_text.extract_text().lower().find(str.lower())

    def getToc(self):
        pages = []
        for i in range(8):
            if self.searchStrInPage(i, "Contents") != -1:
                pages.append(i)
        # reg expression to match '6 Deep Feedforward Networks 168'
        pattern_chapter = re.compile(r"(\d+)\s+(.*)\s+(\d+)")
        # match '6.1 Example: Learning XOR . . . . . . . . . . . . . . . . . . . . . . . 171',
        pattern_section = re.compile(
            r"(\d+)\.(\d+)\s+([\?\,\'\’\(\)a-zA-Z\:\s\-]+)\s+.*\s+(\d+)"
        )

        # save to dict
        toc = {}
        for page in pages:
            page_text = self.readPage(page)
            text = page_text.extract_text()
            lines = text.split("\n")
            for line in lines:
                match_chapter = pattern_chapter.match(line)
                match_section = pattern_section.match(line)
                if match_chapter:
                    chapter = {
                        "chapter": match_chapter.group(1),
                        "title": match_chapter.group(2),
                        "page": match_chapter.group(3),
                    }
                elif match_section:
                    section = {
                        "chapter": match_section.group(1),
                        "section": match_section.group(2),
                        "title": match_section.group(3),
                        "page": match_section.group(4),
                    }
                    if chapter["chapter"] not in toc:
                        toc[chapter["chapter"]] = {
                            "title": chapter["title"],
                            "page": chapter["page"],
                            "sections": [],
                        }
                    toc[chapter["chapter"]]["sections"].append(section)

        # add end page
        for chapter in toc:
            try:
                toc[chapter]["end_page"] = toc[str(int(chapter) + 1)]["page"]
            except:
                toc[chapter]["end_page"] = self.book_end_page
            for section in toc[chapter]["sections"]:
                try:
                    section["end_page"] = toc[chapter]["sections"][
                        int(section["section"])
                    ]["page"]
                except:
                    section["end_page"] = toc[chapter]["end_page"]
        # write to json
        with open(os.path.join(self.dataDir, "toc.json"), "w") as f:
            json.dump(toc, f, indent=4)
        return len(toc)

    def loadToc(self):
        with open(os.path.join(self.dataDir, "toc.json"), "r") as f:
            toc = json.load(f)
        return toc

    def getChapter(self, chapter: str):
        toc = self.loadToc()
        page = toc[chapter]["page"]
        end_page = toc[chapter]["end_page"]
        return self.readPageInInterval(int(page), int(end_page))

    # read by sections, since we need to extract the relations between section and entity.
    def getSection(self, chapter: str, section: str):
        # transform section number to index
        section_idx = int(section) - 1
        toc = self.loadToc()
        page = toc[chapter]["sections"][section_idx]["page"]
        end_page = toc[chapter]["sections"][section_idx]["end_page"]
        return self.readPageInInterval(int(page), int(end_page))