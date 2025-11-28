document.addEventListener('DOMContentLoaded', async () => {

    // --- Map State ---
    let map;
    const checkpointMarkers = L.layerGroup();
    const routeLines = L.layerGroup();
    const commsRelayMarkers = L.layerGroup();
    const convoyMarkers = L.layerGroup();
    const riskColors = { 1: '#28a745', 2: '#ffc107', 3: '#fd7e14', 4: '#dc3545', 5: '#721c24' };

    // --- References to UI Elements ---
    const startCheckpointSelect = document.getElementById('start-checkpoint');
    const targetDestinationSelect = document.getElementById('target-destination');
    const generateRouteButton = document.querySelector('.generate-route');
    const awaitingParamsText = document.querySelector('.awaiting-params');
    const satelliteLinkText = document.querySelector('.satellite-link');
    const syncButton = document.querySelector('.data-sync .icon-button');
    const timestampDisplay = document.querySelector('.data-sync .timestamp');
    const routeDetailsContainer = document.getElementById('route-details');
    const fleetListContainer = document.getElementById('fleet-list');
    const configButton = document.getElementById('config-button');
    const configModal = document.getElementById('config-modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const commsRelayButton = document.getElementById('comms-relay-button');
    const intelAnalyticsButton = document.getElementById('intel-analytics-button');
    const intelAnalyticsPanel = document.getElementById('intel-analytics-panel');
    const activeConvoysButton = document.getElementById('active-convoys-button');
    const navigationButton = document.getElementById('navigation-button');
    const onlineStatusDiv = document.querySelector('.online-status');

    // --- State ---
    let lastSyncTimestamp = new Date(0).toISOString();

    // --- Map Initialization ---
    function initMap() {
        map = L.map('map').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        checkpointMarkers.addTo(map);
        routeLines.addTo(map);
    }

    // --- Draw Functions ---
    function drawCheckpoints(checkpoints) {
        checkpointMarkers.clearLayers();
        commsRelayMarkers.clearLayers();
        if (!checkpoints || checkpoints.length === 0) return;
        const bounds = [];
        checkpoints.forEach(cp => {
            const marker = L.marker([cp.latitude, cp.longitude]).bindPopup(`<b>${cp.name}</b>`);
            checkpointMarkers.addLayer(marker);
            bounds.push([cp.latitude, cp.longitude]);
            if (cp.is_comms_relay) {
                const relayCircle = L.circle([cp.latitude, cp.longitude], { radius: 50000, color: '#007bff', fillColor: '#007bff', fillOpacity: 0.1 }).bindPopup(`<b>${cp.name}</b><br>Comms Relay`);
                commsRelayMarkers.addLayer(relayCircle);
            }
        });
        if (bounds.length > 0 && (!map.getBounds().contains(L.latLngBounds(bounds)) || map.getZoom() < 4)) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    async function renderActiveConvoys() {
        convoyMarkers.clearLayers();
        try {
            const response = await fetch('/operations/api/active-convoys/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const convoys = await response.json();
            const truckIcon = L.divIcon({ html: '<i class="fa-solid fa-truck"></i>', className: 'map-truck-icon', iconSize: [20, 20], iconAnchor: [10, 10] });
            convoys.forEach(convoy => {
                const popupContent = `<b>${convoy.name}</b><br>Status: ${convoy.status}`;
                const marker = L.marker([convoy.current_latitude, convoy.current_longitude], { icon: truckIcon }).bindPopup(popupContent);
                convoyMarkers.addLayer(marker);
            });
        } catch (error) {
            console.error("Failed to fetch active convoys:", error);
        }
    }

    function drawRoute(route) {
        routeLines.clearLayers();
        route.segments.forEach(segment => {
            const polyline = L.polyline(segment.path, { color: riskColors[segment.tari_score] || '#000000', weight: 5, opacity: 0.8 });
            routeLines.addLayer(polyline);
        });
        if (route.segments.length > 0) {
            map.fitBounds(routeLines.getBounds(), { padding: [50, 50] });
        }
    }

    // --- Data Fetching and Rendering ---
    async function populateDropdowns() {
        try {
            const response = await fetch('/navigation/api/offline-data/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            startCheckpointSelect.innerHTML = '<option value="">Select Origin...</option>';
            targetDestinationSelect.innerHTML = '<option value="">Select Destination...</option>';
            data.checkpoints.forEach(cp => {
                const displayText = `${cp.name}`;
                [startCheckpointSelect, targetDestinationSelect].forEach(sel => sel.add(new Option(displayText, cp.id)));
            });
            drawCheckpoints(data.checkpoints);
        } catch (error) {
            console.error("Failed to fetch checkpoints:", error);
        }
    }

    function renderRouteDetails(route) {
        routeDetailsContainer.innerHTML = '';
        routeDetailsContainer.style.display = 'block';
        const title = document.createElement('h4');
        title.textContent = 'Smart Route Segments';
        routeDetailsContainer.appendChild(title);
        route.segments.forEach(segment => {
            const segmentDiv = document.createElement('div');
            segmentDiv.className = 'route-segment';
            segmentDiv.innerHTML = `<span class="segment-info">${segment.from} -> ${segment.to}</span><span class="segment-risk risk-${segment.tari_score}">Risk: ${segment.tari_score}</span>`;
            routeDetailsContainer.appendChild(segmentDiv);
        });
    }

    async function renderFleetStatus() {
        if (!fleetListContainer) return;
        try {
            const response = await fetch('/operations/api/fleet-status/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const vehicles = await response.json();
            fleetListContainer.innerHTML = '';
            if (vehicles.length === 0) {
                fleetListContainer.textContent = 'No vehicle data available.';
                return;
            }
            vehicles.forEach(vehicle => {
                const item = document.createElement('div');
                item.className = 'vehicle-item';
                const statusText = vehicle.status.replace('_', ' ');
                item.innerHTML = `<h5>${vehicle.name}<span class="status-text status-${vehicle.status}">${statusText}</span></h5><div class="vehicle-details"><p><strong>Op. Hours:</strong> ${vehicle.operating_hours}</p></div>`;
                fleetListContainer.appendChild(item);
            });
        } catch (error) {
            console.error("Failed to fetch fleet status:", error);
            fleetListContainer.innerHTML = '<p style="color: red;">Error loading fleet status.</p>';
        }
    }
    
    // --- UI Setup and Heartbeat ---
    function setupModal() {
        if (configButton && configModal && modalCloseButton) {
            configButton.addEventListener('click', () => configModal.classList.remove('hidden'));
            modalCloseButton.addEventListener('click', () => configModal.classList.add('hidden'));
            configModal.addEventListener('click', (e) => {
                if (e.target === configModal) configModal.classList.add('hidden');
            });
        }
    }

    function setupNavButtons() {
        const navButtons = document.querySelectorAll('.navigation button');
        navigationButton.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            navigationButton.classList.add('active');

            routeLines.clearLayers();
            map.removeLayer(convoyMarkers);
            map.removeLayer(commsRelayMarkers);
            routeDetailsContainer.style.display = 'none';
            intelAnalyticsPanel.classList.add('hidden');
            
            if (checkpointMarkers.getLayers().length > 0) {
                map.fitBounds(checkpointMarkers.getBounds(), { padding: [50, 50] });
            }
        });

        [commsRelayButton, intelAnalyticsButton, activeConvoysButton].forEach(button => {
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    button.classList.toggle('active');
                });
            }
        });

        if (commsRelayButton) {
            commsRelayButton.addEventListener('click', () => {
                if (map.hasLayer(commsRelayMarkers)) map.removeLayer(commsRelayMarkers);
                else map.addLayer(commsRelayMarkers);
            });
        }
        if (intelAnalyticsButton) {
            intelAnalyticsButton.addEventListener('click', () => intelAnalyticsPanel.classList.toggle('hidden'));
        }
        if (activeConvoysButton) {
            activeConvoysButton.addEventListener('click', () => {
                if (map.hasLayer(convoyMarkers)) map.removeLayer(convoyMarkers);
                else renderActiveConvoys().then(() => map.addLayer(convoyMarkers));
            });
        }
    }

    async function checkOnlineStatus() {
        try {
            const response = await fetch('/api/health-check/');
            if (!response.ok) throw new Error('Server not responding');
            const data = await response.json();
            if (data.status === 'ok') {
                onlineStatusDiv.innerHTML = '<i class="fa-solid fa-wifi"></i><span>ONLINE</span>';
                onlineStatusDiv.style.color = '#28a745';
            } else {
                throw new Error('Invalid health status');
            }
        } catch (error) {
            onlineStatusDiv.innerHTML = '<i class="fa-solid fa-plane-slash"></i><span>OFFLINE</span>';
            onlineStatusDiv.style.color = '#dc3545';
        }
    }

    // --- Event Listeners ---
    if (generateRouteButton) {
        generateRouteButton.addEventListener('click', async () => {
            const start = startCheckpointSelect.value;
            const end = targetDestinationSelect.value;
            routeDetailsContainer.style.display = 'none';
            routeLines.clearLayers();
            if (!start || !end) {
                awaitingParamsText.textContent = 'ERROR: PLEASE SELECT ORIGIN AND DESTINATION';
                return;
            }
            if (start === end) {
                awaitingParamsText.textContent = 'ERROR: ORIGIN AND DESTINATION CANNOT BE THE SAME';
                return;
            }
            awaitingParamsText.textContent = `GENERATING ROUTE...`;
            satelliteLinkText.textContent = 'ESTABLISHING SECURE UPLINK...';
            try {
                const response = await fetch('/navigation/api/get-smart-route/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ start_checkpoint_id: start, end_checkpoint_id: end })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const routeData = await response.json();
                const primaryRoute = routeData.primary_route;
                awaitingParamsText.textContent = `ROUTE GENERATED: ${primaryRoute.total_distance_km} km, ${primaryRoute.estimated_duration_mins} mins.`;
                satelliteLinkText.textContent = 'SECURE SATELLITE LINK ESTABLISHED';
                renderRouteDetails(primaryRoute);
                drawRoute(primaryRoute);
            } catch (error) {
                console.error("Failed to generate smart route:", error);
                awaitingParamsText.textContent = `ERROR: ${error.message}`;
                satelliteLinkText.textContent = 'UPLINK FAILED';
            }
        });
    }
    if (syncButton) {
        syncButton.addEventListener('click', async () => {
            timestampDisplay.textContent = 'SYNCING...';
            syncButton.disabled = true;
            syncButton.querySelector('i').classList.add('fa-spin');
            try {
                const response = await fetch('/navigation/api/sync/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ last_sync_timestamp: lastSyncTimestamp })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const syncData = await response.json();
                lastSyncTimestamp = syncData.current_server_time;
                timestampDisplay.textContent = `LAST: ${new Date(lastSyncTimestamp).toLocaleTimeString('en-GB')}`;
                if (syncData.updated_checkpoints.length > 0) await populateDropdowns();
                await renderFleetStatus();
            } catch (error) {
                console.error("Failed to sync data:", error);
                timestampDisplay.textContent = 'SYNC FAILED';
            } finally {
                syncButton.disabled = false;
                syncButton.querySelector('i').classList.remove('fa-spin');
            }
        });
    }

    // --- Initial Population ---
    initMap();
    setupModal();
    setupNavButtons();
    await populateDropdowns();
    await renderFleetStatus();
    setInterval(checkOnlineStatus, 15000);
    checkOnlineStatus();
});
