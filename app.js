let inventarioMap = new Map();
let resultadosActuales = []; 
let ordenAscendente = true;

window.onload = async function() {
    try {
        const respuesta = await fetch('inventario.csv?v=' + Date.now());
        const contenido = await respuesta.text();
        const lineas = contenido.split(/\r?\n/);
        
        lineas.forEach(l => {
            if (!l.trim()) return;
            let sep = l.includes(';') ? ';' : ',';
            let columnas = l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
            if (columnas[7]) {
                let cuentaLimpia = columnas[7].replace(/^0+/, '');
                inventarioMap.set(cuentaLimpia, columnas);
            }
        });
        console.log("Inventario cargado correctamente.");
    } catch (e) { 
        console.error("Error al cargar el CSV:", e); 
    }
};

async function procesarBusqueda() {
    const fileInput = document.getElementById('clientCsvFile');
    const textArea = document.getElementById('reportInput');
    const btn = document.getElementById('btnBuscar');
    
    btn.innerText = "Procesando...";
    btn.disabled = true;

    if (fileInput && fileInput.files.length > 0) {
        const archivo = fileInput.files[0];
        const lector = new FileReader();
        lector.onload = function(e) {
            ejecutarLocalizacion(e.target.result);
            btn.innerHTML = "🔍 Localizar QRs";
            btn.disabled = false;
        };
        lector.readAsText(archivo);
    } else if (textArea && textArea.value.trim() !== "") {
        ejecutarLocalizacion(textArea.value);
        btn.innerHTML = "🔍 Localizar QRs";
        btn.disabled = false;
    } else {
        alert("Por favor, sube un archivo o pega el reporte de clientes.");
        btn.innerHTML = "🔍 Localizar QRs";
        btn.disabled = false;
    }
}

function ejecutarLocalizacion(textoBruto) {
    const regex = /\d{10}/g; 
    const encontrados = textoBruto.match(regex);
    const cuentasUnicas = encontrados ? [...new Set(encontrados)] : [];
    
    if (cuentasUnicas.length === 0) return alert("No se encontraron números de cuenta.");

    resultadosActuales = [];

    cuentasUnicas.forEach(cuentaBuscada => {
        const buscar = cuentaBuscada.replace(/^0+/, '');
        const fila = inventarioMap.get(buscar);

        if (fila) {
            resultadosActuales.push({
                cuenta: cuentaBuscada,
                qr: (fila[6] || "SIN QR").trim().toUpperCase(),
                lat: (fila[16] || "").replace(/"/g, "").trim(),
                lon: (fila[17] || "").replace(/"/g, "").trim(),
                encontrado: true
            });
        } else {
            resultadosActuales.push({
                cuenta: cuentaBuscada,
                qr: "ZZ_NO_ENCONTRADA",
                lat: "", lon: "", encontrado: false
            });
        }
    });

    resultadosActuales.sort((a, b) => a.qr.localeCompare(b.qr, undefined, {numeric: true}));
    renderizarTabla(resultadosActuales);
}

function renderizarTabla(datos) {
    const tbody = document.querySelector("#resultTable tbody");
    let html = "";

    datos.forEach(res => {
        if (res.encontrado) {
            const urlMaps = `https://www.google.com/maps/search/?api=1&query=${res.lat},${res.lon}`;
            html += `
                <tr>
                    <td data-label="CUENTA"><b>${res.cuenta}</b></td>
                    <td data-label="QR"><span class="qr-badge">${res.qr}</span></td>
                    <td data-label="COORD" style="font-size:10px;">${res.lat}, ${res.lon}</td>
                    <td data-label="ACCIÓN"><a href="${urlMaps}" target="_blank" class="btn-mapa">📍 Mapa</a></td>
                </tr>`;
        } else {
            html += `
                <tr class="no-encontrada">
                    <td data-label="CUENTA">${res.cuenta}</td>
                    <td colspan="3">No encontrada en Inventario</td>
                </tr>`;
        }
    });
    tbody.innerHTML = html;
}

function ordenarTabla(columnaIndex) {
    if (resultadosActuales.length === 0) return;
    ordenAscendente = !ordenAscendente;
    resultadosActuales.sort((a, b) => {
        let valA = columnaIndex === 0 ? a.cuenta : a.qr;
        let valB = columnaIndex === 0 ? b.cuenta : b.qr;
        return ordenAscendente ? valA.localeCompare(valB, undefined, {numeric: true}) : valB.localeCompare(valA, undefined, {numeric: true});
    });
    renderizarTabla(resultadosActuales);
}
