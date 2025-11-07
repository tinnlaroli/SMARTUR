import { Component } from "react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">404: Página no encontrada</h1>
      <p className="text-gray-600">La página que estás buscando no existe.</p>
      <link to="/">Volver a la página de inicio</link>
    </div>
  );
};

export default NotFound;