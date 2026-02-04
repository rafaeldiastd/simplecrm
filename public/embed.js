(function () {
    const script = document.currentScript;
    const formId = script.getAttribute('data-form-id');
    const baseUrl = new URL(script.src).origin;

    if (!formId) {
        console.error('CRM Embed: data-form-id attribute is missing.');
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/form/${formId}`;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.minHeight = '300px'; // Default min height
    iframe.setAttribute('scrolling', 'no');

    // Inject iframe after script
    script.parentNode.insertBefore(iframe, script.nextSibling);

    // Listen for resize messages
    window.addEventListener('message', function (event) {
        // Validate origin if possible, but for now accept all for flexibility in dev
        if (event.data && event.data.type === 'crm-resize') {
            iframe.style.height = event.data.height + 'px';
        }
    });
})();
