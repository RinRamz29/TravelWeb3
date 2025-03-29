// Importa React y el hook de estado
import React, { useState } from "react";
// Importa herramientas para interactuar con Internet Computer
import { Actor, HttpAgent } from "@dfinity/agent";

// Componente principal de la aplicación
function App() {
  // Estado para almacenar la lista de marcadores
  const [markers, setMarkers] = useState([]);

  // Función asincrónica para cargar marcadores desde el canister
  const loadMarkers = async () => {
    // Crea un agente HTTP (gestiona comunicación con la blockchain)
    const agent = new HttpAgent();

    // Crea una instancia del actor (conexión con el canister)
    const mapCanister = Actor.createActor(MapCanisterIDL, { agent });

    // Llama al método del canister para obtener marcadores cercanos
    const markers = await mapCanister.getMarkersNear(40.7128, -74.0060); // Coordenadas de NYC

    // Actualiza el estado con los marcadores recibidos
    setMarkers(markers);
  };

  // Renderiza la interfaz
  return (
    <div>
      {/* Botón para cargar marcadores /}
      <button onClick={loadMarkers}>Cargar Marcadores</button>

      {/ Lista de marcadores */}
      <ul>
        {markers.map((marker) => (
          // Cada marcador como elemento de lista
          <li key={marker.id}>{marker.name}</li>  // 'key' ayuda a React a optimizar
        ))}
      </ul>
    </div>
  );
}