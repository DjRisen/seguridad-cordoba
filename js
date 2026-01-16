// Aplicación principal de Seguridad Córdoba

class SeguridadApp {
    constructor() {
        this.currentSection = 'map';
        this.alerts = [];
        this.visits = [];
        this.notes = [];
        this.map = null;
        this.notificationCount = 0;
        this.init();
    }

    init() {
        // Inicializar componentes
        this.initEventListeners();
        this.loadData();
        this.initMap();
        this.showSection('map');
        
        // Actualizar datos cada 10 minutos
        setInterval(() => this.fetchAlerts(), 10 * 60 * 1000);
        
        // Mostrar datos de prueba inicialmente
        this.displayTestData();
    }

    initEventListeners() {
        // Navegación del menú
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').dataset.section;
                this.showSection(section);
                this.toggleSidebar(false);
            });
        });

        // Botones del menú
        document.getElementById('menuBtn').addEventListener('click', () => this.toggleSidebar(true));
        document.getElementById('closeMenuBtn').addEventListener('click', () => this.toggleSidebar(false));

        // Botón de actualización
        document.getElementById('refreshBtn').addEventListener('click', () => this.fetchAlerts());

        // Botones del mapa
        document.getElementById('centerMapBtn').addEventListener('click', () => this.centerMapOnUser());
        document.getElementById('filterBtn').addEventListener('click', () => this.showFilters());

        // Agenda
        document.getElementById('addVisitBtn').addEventListener('click', () => this.showVisitModal());
        document.getElementById('visitForm').addEventListener('submit', (e) => this.saveVisit(e));

        // Notas
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNewNote());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());
        document.getElementById('clearNoteBtn').addEventListener('click', () => this.clearNoteEditor());

        // Modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Configuración
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearLocalData());

        // Notificaciones
        document.getElementById('notificationBtn').addEventListener('click', () => this.showNotifications());
        document.querySelector('.toast-close').addEventListener('click', () => this.hideNotificationToast());
    }

    showSection(section) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Actualizar menú activo
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Mostrar sección seleccionada
        document.getElementById(`${section}-section`).classList.add('active');
        this.currentSection = section;

        // Cargar datos específicos de la sección
        switch(section) {
            case 'notices':
                this.loadNews();
                break;
            case 'agenda':
                this.loadVisits();
                break;
            case 'visited':
                this.loadAlertsList();
                break;
            case 'notes':
                this.loadNotes();
                break;
        }
    }

    toggleSidebar(show) {
        const sidebar = document.getElementById('sidebar');
        if (show) {
            sidebar.classList.add('active');
        } else {
            sidebar.classList.remove('active');
        }
    }

    initMap() {
        // Coordenadas de Córdoba, Argentina
        const cordobaCoords = [-31.4201, -64.1888];
        
        // Inicializar mapa
        this.map = L.map('map').setView(cordobaCoords, 10);
        
        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Agregar marcador de ubicación del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                L.marker(userCoords)
                    .addTo(this.map)
                    .bindPopup('Tu ubicación actual')
                    .openPopup();
                
                // Agregar círculo de precisión
                L.circle(userCoords, {
                    color: 'blue',
                    fillColor: '#30f',
                    fillOpacity: 0.1,
                    radius: position.coords.accuracy
                }).addTo(this.map);
            });
        }
    }

    centerMapOnUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                this.map.setView([position.coords.latitude, position.coords.longitude], 13);
            });
        }
    }

    async fetchAlerts() {
        try {
            // En una implementación real, aquí se haría una petición a una API
            // Por ahora usamos datos de prueba
            const testAlerts = this.generateTestAlerts();
            
            // Filtrar alertas nuevas
            const newAlerts = testAlerts.filter(alert => 
                !this.alerts.some(existing => existing.id === alert.id)
            );
            
            // Agregar nuevas alertas
            this.alerts = [...this.alerts, ...newAlerts];
            
            // Mostrar notificaciones para nuevas alertas
            newAlerts.forEach(alert => {
                this.showNotification(alert);
            });
            
            // Actualizar mapa y estadísticas
            this.updateMapMarkers();
            this.updateStats();
            
            // Guardar en localStorage
            this.saveToLocalStorage();
            
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    }

    generateTestAlerts() {
        const locations = [
            { name: "Córdoba Capital", coords: [-31.4201, -64.1888] },
            { name: "Villa María", coords: [-32.4075, -63.2400] },
            { name: "Río Cuarto", coords: [-33.1239, -64.3490] },
            { name: "Alta Gracia", coords: [-31.6529, -64.4282] },
            { name: "Jesús María", coords: [-30.9815, -64.0942] },
            { name: "Villa Carlos Paz", coords: [-31.4240, -64.4978] },
            { name: "La Falda", coords: [-31.0886, -64.4892] },
            { name: "Cosquín", coords: [-31.2416, -64.4653] }
        ];
        
        const types = ["Robo a persona", "Robo de auto", "Robo a casa", "Robo a comercio"];
        
        const alerts = [];
        const now = new Date();
        
        // Generar 3-5 alertas de prueba
        const numAlerts = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < numAlerts; i++) {
            const location = locations[Math.floor(Math.random() * locations.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const hoursAgo = Math.floor(Math.random() * 24);
            const alertTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            
            alerts.push({
                id: `alert-${Date.now()}-${i}`,
                title: `${type} en ${location.name}`,
                description: `Se reportó un ${type.toLowerCase()} en la zona.`,
                location: location.name,
                coordinates: location.coords,
                type: type,
                timestamp: alertTime.toISOString(),
                status: 'pending',
                details: `El hecho ocurrió aproximadamente ${hoursAgo} hora${hoursAgo !== 1 ? 's' : ''} atrás. Se recomienda precaución en la zona.`,
                address: `Calle ${Math.floor(Math.random() * 1000)} y Av. ${Math.floor(Math.random() * 100)}`,
                source: "Fuente oficial"
            });
        }
        
        return alerts;
    }

    updateMapMarkers() {
        // Limpiar marcadores existentes
        if (this.mapMarkers) {
            this.mapMarkers.forEach(marker => marker.remove());
        }
        
        this.mapMarkers = [];
        
        // Agregar marcadores para cada alerta
        this.alerts.forEach(alert => {
            if (alert.coordinates) {
                const markerColor = alert.status === 'visited' ? 'green' : 'red';
                const markerIcon = L.divIcon({
                    html: `<div class="custom-marker" style="background-color: ${markerColor}">
                             <i class="fas fa-exclamation-triangle"></i>
                           </div>`,
                    className: 'custom-marker-icon',
                    iconSize: [30, 30]
                });
                
                const marker = L.marker(alert.coordinates, { icon: markerIcon })
                    .addTo(this.map)
                    .bindPopup(`
                        <strong>${alert.title}</strong><br>
                        <small>${new Date(alert.timestamp).toLocaleString()}</small><br>
                        ${alert.address}<br>
                        <button onclick="app.showAlertDetails('${alert.id}')" class="btn-small">
                            Ver detalles
                        </button>
                    `);
                
                this.mapMarkers.push(marker);
            }
        });
    }

    showAlertDetails(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;
        
        document.getElementById('alertModalTitle').textContent = alert.title;
        document.getElementById('alertModalBody').innerHTML = `
            <div class="alert-details">
                <p><strong>Tipo:</strong> ${alert.type}</p>
                <p><strong>Ubicación:</strong> ${alert.location}</p>
                <p><strong>Dirección:</strong> ${alert.address}</p>
                <p><strong>Fecha y hora:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                <p><strong>Descripción:</strong> ${alert.description}</p>
                <p><strong>Detalles:</strong> ${alert.details}</p>
                <p><strong>Fuente:</strong> ${alert.source}</p>
                <p><strong>Estado:</strong> <span class="alert-status status-${alert.status}">
                    ${alert.status === 'visited' ? 'Visitado' : 'Pendiente'}
                </span></p>
                ${alert.observations ? `<p><strong>Observaciones:</strong> ${alert.observations}</p>` : ''}
            </div>
        `;
        
        // Configurar botones del modal
        document.getElementById('markVisitedBtn').onclick = () => this.markAsVisited(alertId);
        document.getElementById('addToAgendaBtn').onclick = () => this.addToAgenda(alertId);
        
        this.showModal('alertModal');
    }

    markAsVisited(alertId) {
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex !== -1) {
            this.alerts[alertIndex].status = 'visited';
            this.alerts[alertIndex].visitedDate = new Date().toISOString();
            
            // Actualizar interfaz
            this.updateMapMarkers();
            this.updateStats();
            this.saveToLocalStorage();
            
            // Cerrar modal
            this.closeModal();
            
            // Mostrar confirmación
            this.showNotificationToast('Alerta marcada como visitada');
        }
    }

    addToAgenda(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;
        
        // Llenar formulario de visita
        document.getElementById('visitAlert').value = alertId;
        
        // Establecer fecha por defecto (mañana a las 10 AM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const formattedDate = tomorrow.toISOString().slice(0, 16);
        document.getElementById('visitDate').value = formattedDate;
        
        // Cambiar a modal de visita
        this.closeModal();
        this.showModal('visitModal');
    }

    showNotification(alert) {
        // Incrementar contador de notificaciones
        this.notificationCount++;
        document.getElementById('notificationCount').textContent = this.notificationCount;
        
        // Mostrar toast de notificación
        document.getElementById('toastMessage').textContent = alert.title;
        this.showNotificationToast();
        
        // Reproducir sonido si está habilitado
        if (document.getElementById('enableSound').checked) {
            const sound = document.getElementById('notificationSound');
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Error playing sound:', e));
        }
        
        // Mostrar notificación del sistema si está permitido
        if (Notification.permission === 'granted' && document.getElementById('enableNotifications').checked) {
            new Notification('Nueva alerta de seguridad', {
                body: alert.title,
                icon: 'icons/icon-192.png'
            });
        }
    }

    showNotificationToast() {
        const toast = document.getElementById('notificationToast');
        toast.classList.add('show');
        
        // Ocultar automáticamente después de 5 segundos
        setTimeout(() => {
            this.hideNotificationToast();
        }, 5000);
    }

    hideNotificationToast() {
        document.getElementById('notificationToast').classList.remove('show');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    saveVisit(e) {
        e.preventDefault();
        
        const visitData = {
            id: `visit-${Date.now()}`,
            alertId: document.getElementById('visitAlert').value,
            date: document.getElementById('visitDate').value,
            notes: document.getElementById('visitNotes').value,
            priority: document.getElementById('visitPriority').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        this.visits.push(visitData);
        this.saveToLocalStorage();
        this.closeModal();
        this.showNotificationToast('Visita agendada correctamente');
        
        // Actualizar lista de visitas si estamos en esa sección
        if (this.currentSection === 'agenda') {
            this.loadVisits();
        }
    }

    addNewNote() {
        const noteId = `note-${Date.now()}`;
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.dataset.id = noteId;
        noteItem.innerHTML = `
            <div class="note-header">
                <span class="note-title">Nueva nota</span>
                <span class="note-date">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="note-preview">Escribe tu nota aquí...</div>
        `;
        
        noteItem.addEventListener('click', () => this.editNote(noteId));
        document.getElementById('notesList').prepend(noteItem);
        
        // Limpiar editor y preparar para nueva nota
        document.getElementById('noteContent').value = '';
        document.getElementById('noteContent').dataset.noteId = noteId;
        document.getElementById('noteContent').focus();
    }

    saveNote() {
        const noteContent = document.getElementById('noteContent').value;
        const noteId = document.getElementById('noteContent').dataset.noteId;
        
        if (!noteContent.trim()) {
            this.showNotificationToast('La nota no puede estar vacía');
            return;
        }
        
        const note = {
            id: noteId || `note-${Date.now()}`,
            content: noteContent,
            title: noteContent.substring(0, 50) + (noteContent.length > 50 ? '...' : ''),
            date: new Date().toISOString()
        };
        
        // Actualizar o agregar nota
        const noteIndex = this.notes.findIndex(n => n.id === note.id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = note;
        } else {
            this.notes.push(note);
        }
        
        this.saveToLocalStorage();
        this.loadNotes();
        this.showNotificationToast('Nota guardada correctamente');
    }

    clearNoteEditor() {
        document.getElementById('noteContent').value = '';
        document.getElementById('noteContent').dataset.noteId = '';
    }

    loadNotes() {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        
        this.notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.id = note.id;
            noteItem.innerHTML = `
                <div class="note-header">
                    <span class="note-title">${note.title}</span>
                    <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                </div>
                <div class="note-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
            `;
            
            noteItem.addEventListener('click', () => this.editNote(note.id));
            notesList.appendChild(noteItem);
        });
    }

    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteContent').dataset.noteId = note.id;
            document.getElementById('noteContent').focus();
        }
    }

    loadVisits() {
        const visitsList = document.getElementById('visits-list');
        visitsList.innerHTML = '';
        
        this.visits.forEach(visit => {
            const alert = this.alerts.find(a => a.id === visit.alertId);
            if (!alert) return;
            
            const visitItem = document.createElement('div');
            visitItem.className = 'visit-item';
            visitItem.innerHTML = `
                <div class="visit-header">
                    <span class="visit-title">${alert.title}</span>
                    <span class="visit-date">${new Date(visit.date).toLocaleString()}</span>
                </div>
                <div class="visit-details">
                    <span class="visit-priority priority-${visit.priority}">${visit.priority}</span>
                    <span class="visit-status status-${visit.status}">${visit.status === 'completed' ? 'Completada' : 'Pendiente'}</span>
                </div>
                ${visit.notes ? `<div class="visit-notes">${visit.notes}</div>` : ''}
                <div class="visit-actions">
                    <button onclick="app.completeVisit('${visit.id}')" class="btn-small">
                        <i class="fas fa-check"></i> Completar
                    </button>
                </div>
            `;
            
            visitsList.appendChild(visitItem);
        });
    }

    completeVisit(visitId) {
        const visitIndex = this.visits.findIndex(v => v.id === visitId);
        if (visitIndex !== -1) {
            this.visits[visitIndex].status = 'completed';
            this.saveToLocalStorage();
            this.loadVisits();
            this.showNotificationToast('Visita marcada como completada');
        }
    }

    loadAlertsList() {
        const alertsList = document.getElementById('alerts-list');
        alertsList.innerHTML = '';
        
        this.alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div class="alert-header">
                    <span class="alert-title">${alert.title}</span>
                    <span class="alert-date">${new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                <div class="alert-content">
                    <p><strong>Ubicación:</strong> ${alert.location}</p>
                    <p><strong>Dirección:</strong> ${alert.address}</p>
                    <p><strong>Estado:</strong> <span class="alert-status status-${alert.status}">
                        ${alert.status === 'visited' ? 'Visitado' : 'Pendiente'}
                    </span></p>
                </div>
                <div class="alert-actions">
                    <button onclick="app.showAlertDetails('${alert.id}')" class="btn-small">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                    <button onclick="app.addObservation('${alert.id}')" class="btn-small">
                        <i class="fas fa-edit"></i> Agregar observación
                    </button>
                </div>
            `;
            
            alertsList.appendChild(alertItem);
        });
    }

    addObservation(alertId) {
        const observation = prompt('Agregar observación para esta alerta:');
        if (observation) {
            const alertIndex = this.alerts.findIndex(a => a.id === alertId);
            if (alertIndex !== -1) {
                this.alerts[alertIndex].observations = observation;
                this.saveToLocalStorage();
                this.showNotificationToast('Observación agregada correctamente');
            }
        }
    }

    updateStats() {
        const today = new Date().toDateString();
        const todayAlerts = this.alerts.filter(alert => 
            new Date(alert.timestamp).toDateString() === today
        ).length;
        
        const activeAlerts = this.alerts.filter(alert => 
            alert.status === 'pending'
        ).length;
        
        const visitedAlerts = this.alerts.filter(alert => 
            alert.status === 'visited'
        ).length;
        
        document.getElementById('todayAlerts').textContent = todayAlerts;
        document.getElementById('activeAlerts').textContent = activeAlerts;
        document.getElementById('visitedStats').textContent = visitedAlerts;
    }

    loadNews() {
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';
        
        // Ordenar alertas por fecha (más recientes primero)
        const sortedAlerts = [...this.alerts].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        sortedAlerts.forEach(alert => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <div class="news-header">
                    <span class="news-title">${alert.title}</span>
                    <span class="news-date">${new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                <div class="news-content">
                    <p>${alert.description}</p>
                    <p><strong>Ubicación:</strong> ${alert.location}</p>
                    <p><strong>Fuente:</strong> ${alert.source}</p>
                </div>
            `;
            
            newsContainer.appendChild(newsItem);
        });
    }

    loadData() {
        // Cargar datos desde localStorage
        const savedAlerts = localStorage.getItem('cordobaSecurityAlerts');
        const savedVisits = localStorage.getItem('cordobaSecurityVisits');
        const savedNotes = localStorage.getItem('cordobaSecurityNotes');
        
        if (savedAlerts) {
            this.alerts = JSON.parse(savedAlerts);
        }
        
        if (savedVisits) {
            this.visits = JSON.parse(savedVisits);
        }
        
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('cordobaSecurityAlerts', JSON.stringify(this.alerts));
        localStorage.setItem('cordobaSecurityVisits', JSON.stringify(this.visits));
        localStorage.setItem('cordobaSecurityNotes', JSON.stringify(this.notes));
    }

    exportData() {
        const data = {
            alerts: this.alerts,
            visits: this.visits,
            notes: this.notes,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `seguridad-cordoba-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotificationToast('Datos exportados correctamente');
    }

    clearLocalData() {
        if (confirm('¿Está seguro de que desea eliminar todos los datos locales? Esta acción no se puede deshacer.')) {
            localStorage.clear();
            this.alerts = [];
            this.visits = [];
            this.notes = [];
            
            // Recargar datos iniciales de prueba
            this.displayTestData();
            
            this.showNotificationToast('Datos locales eliminados');
        }
    }

    displayTestData() {
        // Generar datos de prueba iniciales
        const testAlerts = this.generateTestAlerts();
        this.alerts = [...this.alerts, ...testAlerts];
        
        // Actualizar interfaz
        this.updateMapMarkers();
        this.updateStats();
        this.loadNews();
        
        // Mostrar notificación de bienvenida
        setTimeout(() => {
            this.showNotificationToast('Bienvenido a Seguridad Córdoba. Se han cargado datos de prueba.');
        }, 1000);
    }

    showFilters() {
        alert('Funcionalidad de filtros en desarrollo. Próximamente disponible.');
    }

    showNotifications() {
        alert('Historial de notificaciones en desarrollo. Próximamente disponible.');
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SeguridadApp();
    
    // Solicitar permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
