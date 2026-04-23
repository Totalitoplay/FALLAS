let inventarioMap = new Map();
let resultadosActuales = []; 
let ordenAscendente = true;

window.onload = async function() {
    try {
        const respuesta = await fetch('inventario.csv');
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

function buscarCuentas() {
    const texto = document.getElementById('reportInput').value;
    const regex = /\d{10}/g; 
    const encontrados = texto.match(regex);
    const cuentasUnicas = encontrados ? [...new Set(encontrados)] : [];
    
    resultadosActuales = []; 

    cuentasUnicas.forEach(cuentaBuscada => {
        const buscar = cuentaBuscada.replace(/^0+/, '');
        const fila = inventarioMap.get(buscar);

        if (fila) {
            resultadosActuales.push({
                cuenta: cuentaBuscada,
                qr: (fila[6] || "SIN QR").trim().toUpperCase(),
                lat: fila[16] || "",
                lon: fila[17] || "",
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

    renderizarTabla(resultadosActuales);
}

function renderizarTabla(datos) {
    const tbody = document.querySelector("#resultTable tbody");
    let html = "";

    datos.forEach(res => {
        if (res.encontrado) {
            // URL CORREGIDA: Sin el '2{' que sobraba
            const urlMaps = `https://www.google.com/maps/search/?api=1&query=${res.lat},${res.lon}`;
            html += `
                <tr>
                    <td><b>${res.cuenta}</b></td>
                    <td style="color:#d35400; font-weight:bold; background:#fff8f0;">${res.qr}</td>
                    <td style="font-size: 11px;">${res.lat}, ${res.lon}</td>
                    <td><a href="${urlMaps}" target="_blank" style="background:#27ae60; color:white; padding:4px 8px; text-decoration:none; border-radius:4px; font-size:11px;">📍 Ver Mapa</a></td>
                </tr>`;
        } else {
            html += `<tr style="background:#fff5f5; color:#c0392b;"><td>${res.cuenta}</td><td colspan="3" style="font-size:11px; font-style:italic;">No encontrada</td></tr>`;
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

        return ordenAscendente 
            ? valA.localeCompare(valB, undefined, {numeric: true}) 
            : valB.localeCompare(valA, undefined, {numeric: true});
    });

    renderizarTabla(resultadosActuales);
}
