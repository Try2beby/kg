window.onload = function () {
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

    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport({ scale: 0.75 });
            // Get device pixel ratio
            var resolution = window.devicePixelRatio || 1;

            // Set dimensions to Canvas
            canvas.style.width = viewport.width + "px"; // Use CSS styles to set the display size
            canvas.style.height = viewport.height + "px";
            canvas.width = viewport.width * resolution; // Use device pixel ratio to set the resolution
            canvas.height = viewport.height * resolution;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport,
                transform: [resolution, 0, 0, resolution, 0, 0] // force it bigger size
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // Update page counters
        document.getElementById('page_num').textContent = num;
    }

    function queueRenderPage(num) {
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
}
