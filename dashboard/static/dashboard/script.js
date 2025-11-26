document.addEventListener('DOMContentLoaded', () => {

    // --- Smart Route Feature ---
    const smartRouteForm = document.getElementById('smart-route-form');
    const smartRouteResult = document.getElementById('smart-route-result');

    smartRouteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        smartRouteResult.innerHTML = '<pre>Fetching smart route...</pre>';

        const startId = document.getElementById('start-checkpoint').value;
        const endId = document.getElementById('end-checkpoint').value;

        try {
            const response = await fetch('/navigation/api/get-smart-route/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Django requires a CSRF token for POST requests, but for this simple demo,
                    // we'll assume the API view is configured to not require it or we're using a workaround.
                    // For a real app, you'd fetch the token and include it.
                },
                body: JSON.stringify({
                    start_checkpoint_id: startId,
                    end_checkpoint_id: endId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            smartRouteResult.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

        } catch (error) {
            smartRouteResult.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
    });


    // --- Offline Data Feature ---
    const fetchOfflineDataBtn = document.getElementById('fetch-offline-data');
    const offlineDataResult = document.getElementById('offline-data-result');

    fetchOfflineDataBtn.addEventListener('click', async () => {
        offlineDataResult.innerHTML = '<pre>Fetching all offline data...</pre>';

        try {
            const response = await fetch('/navigation/api/offline-data/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            offlineDataResult.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

        } catch (error) {
            offlineDataResult.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
    });

});
