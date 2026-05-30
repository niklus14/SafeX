function markerColor(risk) {

  if(risk < 25)
      return "green";

  if(risk < 50)
      return "yellow";

  if(risk < 75)
      return "orange";

  return "red";
}