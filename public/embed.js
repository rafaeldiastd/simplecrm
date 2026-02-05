(function () {
    const script = document.currentScript;
    const formId = script.getAttribute('data-form-id');
    const baseUrl = new URL(script.src).origin;

    if (!formId) {
        console.error('CRM Embed: data-form-id attribute is missing.');
        return;
    }

    // --- Iframe Creation ---
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/form/${formId}`;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.minHeight = '300px';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('scrolling', 'no');

    // Inject iframe
    script.parentNode.insertBefore(iframe, script.nextSibling);

    // Listen for resize
    window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'crm-resize') {
            iframe.style.height = event.data.height + 'px';
        }
    });
})();
