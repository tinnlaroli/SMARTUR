import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:smartur/l10n/app_localizations.dart';

import '../../../core/theme/style_guide.dart';
import '../../../core/constants/env_config.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/profile_service.dart';
import '../../../data/services/user_content_service.dart';
import '../../../core/utils/notifications.dart';
import '../../../core/utils/image_export_service.dart';
import '../../widgets/smartur_background.dart';

class RecommendationScreen extends StatefulWidget {
  final String? city;

  const RecommendationScreen({super.key, this.city});

  @override
  State<RecommendationScreen> createState() => _RecommendationScreenState();
}

class _RecommendationScreenState extends State<RecommendationScreen> {
  bool _isLoadingContext = true;
  bool _isFetchingRecommendations = false;
  List<dynamic> _recommendations = [];

  // Form State
  String _presupuesto = 'medio';
  String _edadRange = '35-44';
  List<String> _tiposTurismo = ['cultural', 'gastronomico'];
  String _groupType = 'familia';
  bool _wantsTours = false;
  bool _needsHotel = false;
  bool _prefFood = true;
  bool _reqAccesibilidad = false;
  bool _prefOutdoor = false;

  final List<String> _availableTurismoTypes = [
    'cultural', 'gastronomico', 'aventura', 'descanso', 'naturaleza', 'nocturno'
  ];

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final profile = await ProfileService.fetchMyProfileForPreferences();
      if (profile.isNotEmpty) {
        setState(() {
          if (profile.containsKey('age') && profile['age'] != null) {
            final age = profile['age'] as int;
            if (age < 25) {
              _edadRange = '18-24';
            } else if (age < 35) {
              _edadRange = '25-34';
            } else if (age < 45) {
              _edadRange = '35-44';
            } else if (age < 55) {
              _edadRange = '45-54';
            } else if (age < 65) {
              _edadRange = '55-64';
            } else {
              _edadRange = '65+';
            }
          }
          if (profile.containsKey('interests') && profile['interests'] is List) {
            final interests = (profile['interests'] as List).cast<String>();
            // Keep only those that intersect with our available types (or map them)
            final validInterests = interests.where((e) => _availableTurismoTypes.contains(e.toLowerCase())).toList();
            if (validInterests.isNotEmpty) {
              _tiposTurismo = validInterests.map((e) => e.toLowerCase()).toList();
            }
          }
          if (profile.containsKey('has_accessibility')) {
            _reqAccesibilidad = profile['has_accessibility'] == true;
          }
          // The rest can be mapped similarly if they exist in ProfileService
        });
      }
    } catch (_) {
      // Ignorar error y usar valores por defecto
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingContext = false;
        });
      }
    }
  }

  Future<void> _fetchRecommendations() async {
    final l10n = AppLocalizations.of(context);
    setState(() {
      _isFetchingRecommendations = true;
      _recommendations = [];
    });

    try {
      final auth = AuthService();
      final userId = await auth.getUserId();
      
      if (userId == null) {
        if (!mounted) return;
        SmarturNotifications.showError(context, l10n?.sessionExpiredPreferences ?? 'Error: Usuario no autenticado');
        setState(() => _isFetchingRecommendations = false);
        return;
      }

      final url = Uri.parse('${EnvConfig.aiEngineUrl}/recommend/$userId');
      final payload = {
        "alpha": 0.2,
        "top_n": 5,
        "context": {
          "presupuesto_bucket": _presupuesto,
          "edad_range": _edadRange,
          "tiposTurismo": _tiposTurismo.isEmpty ? ["cultural"] : _tiposTurismo,
          "group_type": _groupType,
          "wants_tours": _wantsTours,
          "needs_hotel": _needsHotel,
          "pref_food": _prefFood,
          "requiere_accesibilidad": _reqAccesibilidad,
          "pref_outdoor": _prefOutdoor
        }
      };

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          // Ajusta esta clave a lo que devuelva exactamente tu API en FastAPI.
          // Suponiendo que devuelve una lista en 'recommendations' o similar.
        if (data is List) {
          _recommendations = data;
        } else if (data['recommendations'] != null) {
          _recommendations = data['recommendations'];
        } else {
          _recommendations = [data]; // Fallback
        }
        if (_recommendations.isNotEmpty) {
           _showResultsModal(context, _recommendations);
        }
      });
      } else {
        throw Exception('Server returned ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        SmarturNotifications.showError(context, 'Error obteniendo recomendaciones: $e');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingRecommendations = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayCity = widget.city ?? 'Altas Montañas (IA)';
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: Text(
          l10n?.recommendationsInCity(displayCity) ?? 'Recomendaciones IA',
          style: SmarturStyle.calSansTitle.copyWith(fontSize: 20),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      body: SmarturBackgroundTop(
        child: _isLoadingContext
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                child: _buildForm(scheme),
              ),
      ),
    );
  }

  Widget _buildForm(ColorScheme scheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(SmarturStyle.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Personaliza tu búsqueda',
            style: SmarturStyle.calSansTitle.copyWith(fontSize: 18, color: scheme.primary),
          ),
          const SizedBox(height: SmarturStyle.spacingMd),
          
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Presupuesto', border: OutlineInputBorder()),
                  initialValue: _presupuesto,
                  items: const [
                    DropdownMenuItem(value: 'bajo', child: Text('Bajo')),
                    DropdownMenuItem(value: 'medio', child: Text('Medio')),
                    DropdownMenuItem(value: 'alto', child: Text('Alto')),
                  ],
                  onChanged: (val) => setState(() => _presupuesto = val!),
                ),
              ),
              const SizedBox(width: SmarturStyle.spacingSm),
              Expanded(
                child: DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Edad', border: OutlineInputBorder()),
                  initialValue: _edadRange,
                  items: const [
                    DropdownMenuItem(value: '18-24', child: Text('18-24')),
                    DropdownMenuItem(value: '25-34', child: Text('25-34')),
                    DropdownMenuItem(value: '35-44', child: Text('35-44')),
                    DropdownMenuItem(value: '45-54', child: Text('45-54')),
                    DropdownMenuItem(value: '55-64', child: Text('55-64')),
                    DropdownMenuItem(value: '65+', child: Text('65+')),
                  ],
                  onChanged: (val) => setState(() => _edadRange = val!),
                ),
              ),
            ],
          ),
          const SizedBox(height: SmarturStyle.spacingMd),
          
          DropdownButtonFormField<String>(
             decoration: const InputDecoration(labelText: 'Tipo de Grupo', border: OutlineInputBorder()),
             initialValue: _groupType,
             items: const [
               DropdownMenuItem(value: 'solo', child: Text('Solo')),
               DropdownMenuItem(value: 'pareja', child: Text('Pareja')),
               DropdownMenuItem(value: 'familia', child: Text('Familia')),
               DropdownMenuItem(value: 'amigos', child: Text('Amigos')),
             ],
             onChanged: (val) => setState(() => _groupType = val!),
          ),
          const SizedBox(height: SmarturStyle.spacingMd),
          
          Text('Tipos de Turismo:', style: TextStyle(fontWeight: FontWeight.bold, color: scheme.onSurface)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8.0,
            runSpacing: 0,
            children: _availableTurismoTypes.map((type) {
              final isSelected = _tiposTurismo.contains(type);
              return FilterChip(
                label: Text(type),
                selected: isSelected,
                onSelected: (bool selected) {
                  setState(() {
                    if (selected) {
                      _tiposTurismo.add(type);
                    } else {
                      _tiposTurismo.remove(type);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: SmarturStyle.spacingMd),

          Wrap(
            spacing: 16.0,
            children: [
              _buildSwitch('Quiere Tours', _wantsTours, (val) => setState(() => _wantsTours = val)),
              _buildSwitch('Necesita Hotel', _needsHotel, (val) => setState(() => _needsHotel = val)),
              _buildSwitch('Prefiere Comida', _prefFood, (val) => setState(() => _prefFood = val)),
              _buildSwitch('Accesibilidad', _reqAccesibilidad, (val) => setState(() => _reqAccesibilidad = val)),
              _buildSwitch('Exteriores', _prefOutdoor, (val) => setState(() => _prefOutdoor = val)),
            ],
          ),
          const SizedBox(height: SmarturStyle.spacingLg),

          ElevatedButton(
            onPressed: _isFetchingRecommendations ? null : _fetchRecommendations,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: SmarturStyle.purple,
              foregroundColor: Colors.white,
            ),
            child: _isFetchingRecommendations
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Obtener Recomendaciones', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitch(String label, bool value, ValueChanged<bool> onChanged) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: SmarturStyle.purple,
        ),
        Text(label, style: const TextStyle(fontSize: 13)),
      ],
    );
  }

  void _showResultsModal(BuildContext context, List<dynamic> recommendations) {
    final scheme = Theme.of(context).colorScheme;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.75,
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: scheme.outlineVariant, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                'Tus Recomendaciones',
                style: SmarturStyle.calSansTitle.copyWith(fontSize: 22),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: recommendations.length,
                itemBuilder: (c, i) {
                  final item = recommendations[i];
                  final name = item['title'] ?? item['name'] ?? 'Destino ${i + 1}';
                  final score = item['score'] ?? 0.0;
                  return Card(
                    elevation: 0,
                    color: scheme.surfaceContainerHighest.withValues(alpha: 0.3),
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: SmarturStyle.purple,
                        child: Text(score.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(name, style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                   _buildActionButton(ctx, Icons.people_outline, 'Comunidad', SmarturStyle.purple, () async {
                      if (recommendations.isEmpty) return;
                      // El backend requiere un ID numérico.
                      final text = recommendations.take(3).map((e) => "• ${e['title'] ?? e['name']}").join("\n");
                      final caption = "¡Ey! Mira lo que me recomienda SMARTUR en esta ciudad:\n\n$text\n\n¿Cuál debería visitar primero? #SmarturIA";
                      
                      try {
                        SmarturNotifications.showInfo(context, 'Publicando en comunidad...');
                        // Nota: El backend espera un ID real de lugar. Si item_id es un string de Yelp,
                        // el UserContentService podría fallar. Usaremos el primer lugar como ancla.
                        // Intentamos parsear un id numérico si existe, si no avisamos.
                        await UserContentService().createCommunityPost(
                          placeKind: 'poi', // Genérico para recomendaciones externas
                          placeId: 1, // Placeholder ya que las recomendaciones de IA son externas a la DB local por ahora
                          caption: caption,
                        );
                        if (context.mounted) {
                          SmarturNotifications.showSuccess(context, '¡Publicado en la Comunidad!');
                        }
                      } catch (e) {
                         if (context.mounted) {
                            SmarturNotifications.showError(context, 'No se pudo publicar: $e');
                         }
                      }
                   }),
                   _buildActionButton(ctx, Icons.image_outlined, 'Imagen', SmarturStyle.blue, () async {
                      try {
                        SmarturNotifications.showInfo(context, 'Generando tarjeta SMARTUR...');
                        await ImageExportService.shareRecommendationsImage(context, recommendations, widget.city ?? 'Altas Montañas');
                      } catch (e) {
                         if (context.mounted) {
                            SmarturNotifications.showError(context, 'Error al generar imagen: $e');
                         }
                      }
                   }),
                   _buildActionButton(ctx, Icons.chat_outlined, 'WhatsApp', const Color(0xFF25D366), () async {
                      final text = recommendations.take(5).map((e) => "*${e['title'] ?? e['name']}*").join("%0A");
                      final message = "Mis%20recomendaciones%20SMARTUR:%0A%0A$text";
                      
                      // Usar api.whatsapp.com es más robusto para saltar bloqueos de seguridad del OS
                      final url = Uri.parse("https://api.whatsapp.com/send?text=$message");
                      
                      try {
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        } else {
                          if (context.mounted) {
                            SmarturNotifications.showError(context, 'No se pudo abrir WhatsApp');
                          }
                        }
                      } catch (e) {
                         if (context.mounted) {
                            SmarturNotifications.showError(context, 'Error al abrir WhatsApp: $e');
                         }
                      }
                   }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11, fontFamily: 'Outfit', fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
