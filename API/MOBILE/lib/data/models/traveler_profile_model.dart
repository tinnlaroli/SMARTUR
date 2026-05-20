
class TravelerProfile {
  // Datos de Perfil (Step 1)
  final int? age;
  final String? ageRange;
  
  // Preferencias y Estilo (Step 2)
  final List<String> interests; // Mapea con el TEXT[] de PostgreSQL
  final int activityLevel;
  final String preferredPlace;
  
  // Contexto (Step 3 / Step 4)
  final String travelType; // group_type
  final bool hasAccessibility;
  final String? accessibilityDetail;
  final bool hasVisitedBefore;

  TravelerProfile({
    this.age,
    this.ageRange,
    required this.interests,
    this.activityLevel = 3,
    this.preferredPlace = 'indiferente',
    required this.travelType,
    this.hasAccessibility = false,
    this.accessibilityDetail,
    this.hasVisitedBefore = false,
  });

  // Método para convertir de Objeto a JSON (Para el POST al modelo de IA)
  Map<String, dynamic> toJson() {
    return {
      "edad": age,
      "edad_range": ageRange,
      "tiposTurismo": interests,
      "actividad_level": activityLevel,
      "preferencia_lugar": preferredPlace,
      "pref_outdoor": preferredPlace == "aire",
      "group_type": travelType,
      "accesibilidad": hasAccessibility ? "si" : "no",
      "detalleAcc": hasAccessibility ? accessibilityDetail : "",
      "visitado": hasVisitedBefore ? "si" : "no",
    };
  }
}