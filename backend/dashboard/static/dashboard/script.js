document.addEventListener('DOMContentLoaded', async () => {

    // --- Map State ---
    let map;
    const checkpointMarkers = L.layerGroup();
    const routeLines = L.layerGroup();
    const commsRelayMarkers = L.layerGroup();
    const convoyMarkers = L.layerGroup(); // New layer for convoys
    const riskColors = {
        1: '#28a745', // Green
        2: '#ffc107', // Yellow
        3: '#fd7e14', // Orange
        4: '#dc3545', // Red
        5: '#721c24'  // Dark Red
    };

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

    // --- State ---
    let lastSyncTimestamp = new Date(0).toISOString();

    // --- Map Initialization ---
    function initMap() {
        map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        checkpointMarkers.addTo(map);
        routeLines.addTo(map);
    }

    // --- Draw Checkpoints on Map ---
    function drawCheckpoints(checkpoints) {
        checkpointMarkers.clearLayers();
        commsRelayMarkers.clearLayers();
        if (!checkpoints || checkpoints.length === 0) return;

        const bounds = [];
        checkpoints.forEach(cp => {
            const marker = L.marker([cp.latitude, cp.longitude])
                .bindPopup(`<b>${cp.name}</b>`);
            checkpointMarkers.addLayer(marker);
            bounds.push([cp.latitude, cp.longitude]);

            if (cp.is_comms_relay) {
                const relayCircle = L.circle([cp.latitude, cp.longitude], {
                    radius: 50000, // 50km radius
                    color: '#007bff',
                    fillColor: '#007bff',
                    fillOpacity: 0.1
                }).bindPopup(`<b>${cp.name}</b><br>Comms Relay`);
                commsRelayMarkers.addLayer(relayCircle);
            }
        });

        if (!map.getBounds().contains(bounds)) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // --- Draw Active Convoys ---
    async function renderActiveConvoys() {
        convoyMarkers.clearLayers();
        try {
            const response = await fetch('/operations/api/active-convoys/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const convoys = await response.json();

            const truckIcon = L.divIcon({
                html: '<i class="fa-solid fa-truck"></i>',
                className: 'map-truck-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            convoys.forEach(convoy => {
                const popupContent = `<b>${convoy.name}</b><br>Status: ${convoy.status}`;
                const marker = L.marker([convoy.current_latitude, convoy.current_longitude], { icon: truckIcon })
                    .bindPopup(popupContent);
                convoyMarkers.addLayer(marker);
            });
        } catch (error) {
            console.error("Failed to fetch active convoys:", error);
        }
    }

    // --- Draw Route on Map ---
    function drawRoute(route) {
        routeLines.clearLayers();
        route.segments.forEach(segment => {
            const path = segment.path;
            const color = riskColors[segment.tari_score] || '#000000';
            const polyline = L.polyline(path, { color: color, weight: 5, opacity: 0.8 });
            routeLines.addLayer(polyline);
        });

        if (route.segments.length > 0) {
            map.fitBounds(routeLines.getBounds(), { padding: [50, 50] });
        }
    }

    // --- Populate Dropdowns from API ---
    async function populateDropdowns() {
        try {
            const response = await fetch('/navigation/api/offline-data/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const checkpoints = data.checkpoints;

            startCheckpointSelect.innerHTML = '<option value="">Select Origin...</option>';
            targetDestinationSelect.innerHTML = '<option value="">Select Destination...</option>';

            checkpoints.forEach(cp => {
                const displayText = `${cp.name}`;
                const startOption = new Option(displayText, cp.id);
                const endOption = new Option(displayText, cp.id);
                startCheckpointSelect.add(startOption);
                targetDestinationSelect.add(endOption);
            });
            
            drawCheckpoints(checkpoints);

        } catch (error) {
            console.error("Failed to fetch checkpoints:", error);
        }
    }

    // --- Render Functions for Sidebar ---
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
    
    // --- UI Setup ---
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
        if (commsRelayButton) {
            commsRelayButton.addEventListener('click', () => {
                commsRelayButton.classList.toggle('active');
                if (map.hasLayer(commsRelayMarkers)) {
                    map.removeLayer(commsRelayMarkers);
                } else {
                    map.addLayer(commsRelayMarkers);
                }
            });
        }
        if (intelAnalyticsButton && intelAnalyticsPanel) {
            intelAnalyticsButton.addEventListener('click', () => {
                intelAnalyticsButton.classList.toggle('active');
                intelAnalyticsPanel.classList.toggle('hidden');
            });
        }
        if (activeConvoysButton) {
            activeConvoysButton.addEventListener('click', () => {
                activeConvoysButton.classList.toggle('active');
                if (map.hasLayer(convoyMarkers)) {
                    map.removeLayer(convoyMarkers);
                } else {
                    renderActiveConvoys().then(() => map.addLayer(convoyMarkers));
                }
            });
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
                awaitingParamsText.style.color = 'red';
                return;
            }
            if (start === end) {
                awaitingParamsText.textContent = 'ERROR: ORIGIN AND DESTINATION CANNOT BE THE SAME';
                awaitingParamsText.style.color = 'red';
                return;
            }
            awaitingParamsText.textContent = `GENERATING ROUTE...`;
            awaitingParamsText.style.color = '#000';
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
                const distance = primaryRoute.total_distance_km;
                const duration = primaryRoute.estimated_duration_mins;
                awaitingParamsText.textContent = `ROUTE GENERATED: ${distance} km, ${duration} mins.`;
                satelliteLinkText.textContent = 'SECURE SATELLITE LINK ESTABLISHED';
                renderRouteDetails(primaryRoute);
                drawRoute(primaryRoute);
            } catch (error) {
                console.error("Failed to generate smart route:", error);
                awaitingParamsText.textContent = `ERROR: ${error.message}`;
                awaitingParamsText.style.color = 'red';
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
                const newTime = new Date(lastSyncTimestamp).toLocaleTimeString('en-GB');
                timestampDisplay.textContent = `LAST: ${newTime}`;
                const CPs = syncData.updated_checkpoints.length;
                if (CPs > 0) await populateDropdowns();
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
});
