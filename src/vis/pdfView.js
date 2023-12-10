import * as PDFJS from "./lib/pdf.mjs"

var url = "../../data/Deep Learning.pdf";  // Update this path to your PDF file
var { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdf.worker.mjs';

var loadingTask = pdfjsLib.getDocument(url);
var pdfDoc = null;
var pageNum = 1;
var pageRendering = false;
var pageNumPending = null;
var canvas = document.getElementById('pdf-canvas');
var ctx = canvas.getContext('2d');
var viewport = null;

function renderPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        viewport = page.getViewport({ scale: 0.75 });
        var resolution = window.devicePixelRatio || 1;

        // Set dimensions to Canvas
        canvas.style.width = viewport.width + "px";
        canvas.style.height = viewport.height + "px";
        canvas.width = viewport.width * resolution;
        canvas.height = viewport.height * resolution;

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            transform: [resolution, 0, 0, resolution, 0, 0]
        };
        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        // Add text layer
        return page.getTextContent();
    }).then(function (textContent) {
        // // Create text layer div
        // var textLayerDiv = document.getElementById("text-layer");
        // // Clear previous text layer if exists
        // if (textLayerDiv) {
        //     textLayerDiv.innerHTML = "";
        // } else {
        //     textLayerDiv = document.createElement("div");
        //     textLayerDiv.setAttribute("id", "text-layer");
        // }

        // // Set some custom CSS for the text layer div
        // textLayerDiv.style.position = "absolute";
        // textLayerDiv.style.left = "0";
        // textLayerDiv.style.top = "0";
        // textLayerDiv.style.right = "0";
        // textLayerDiv.style.bottom = "0";

        // // Add the text layer div to the DOM
        // canvas.parentNode.appendChild(textLayerDiv);

        // // Create new instance of TextLayerBuilder class
        // var textLayer = new pdfjsLib.renderTextLayer({
        //     // textLayerDiv: textLayerDiv,
        //     container: textLayerDiv,
        //     viewport: viewport,
        //     textDivs: [],
        //     textContentSource: textContent,
        // });

        // Render text-fragments
        // textLayer.render();
    });
    // Update page counters
    document.getElementById('page_num').textContent = num;
}

function queueRenderPage(num) {
    pageNum = num;
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

// Asynchronous download of PDF
loadingTask.promise.then(function (pdf) {
    pdfDoc = pdf;
    document.getElementById('page_count').textContent = pdf.numPages;

    // Initial/first page rendering
    renderPage(pageNum);
});

export { queueRenderPage }
