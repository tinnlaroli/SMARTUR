import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

/// Imagen de internet que funciona igual en el teléfono y en la demo web.
///
/// En el teléfono usa caché en disco ([CachedNetworkImage]). En el navegador, CanvasKit
/// descarga las imágenes con fetch y muchos sitios (avatares, Wikimedia sin CORS, etc.)
/// las bloquean por CORS: ahí se pinta un `<img>` del navegador, que no tiene esa
/// restricción ([WebHtmlElementStrategy.prefer]).
class ImagenRed extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit? fit;
  final FilterQuality filterQuality;
  final int? memCacheWidth;
  final int? memCacheHeight;
  final Duration fadeInDuration;
  final Duration fadeOutDuration;
  final WidgetBuilder? placeholder;
  final WidgetBuilder? errorWidget;

  const ImagenRed({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit,
    this.filterQuality = FilterQuality.medium,
    this.memCacheWidth,
    this.memCacheHeight,
    this.fadeInDuration = const Duration(milliseconds: 200),
    this.fadeOutDuration = const Duration(milliseconds: 100),
    this.placeholder,
    this.errorWidget,
  });

  /// Proveedor para fondos (`DecorationImage`) y precarga; en web no precarga.
  static ImageProvider proveedor(String url) => kIsWeb
      ? NetworkImage(url, webHtmlElementStrategy: WebHtmlElementStrategy.prefer)
      : CachedNetworkImageProvider(url);

  /// Precarga solo en el teléfono: en web la precarga usa fetch y CORS la bloquea.
  static void precargar(String url, BuildContext context) {
    if (kIsWeb || url.isEmpty) return;
    precacheImage(CachedNetworkImageProvider(url), context);
  }

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) {
      return CachedNetworkImage(
        imageUrl: url,
        width: width,
        height: height,
        fit: fit,
        filterQuality: filterQuality,
        memCacheWidth: memCacheWidth,
        memCacheHeight: memCacheHeight,
        fadeInDuration: fadeInDuration,
        fadeOutDuration: fadeOutDuration,
        placeholder: placeholder == null ? null : (c, _) => placeholder!(c),
        errorWidget: errorWidget == null ? null : (c, _, _) => errorWidget!(c),
      );
    }
    // El <img> del navegador toma el tamaño natural de la foto si no se le da uno:
    // una foto vertical quedaba angosta en vez de cubrir la tarjeta.
    return LayoutBuilder(builder: (context, c) => Image.network(
      url,
      width: width ?? (c.hasBoundedWidth ? c.maxWidth : null),
      height: height ?? (c.hasBoundedHeight ? c.maxHeight : null),
      fit: fit,
      filterQuality: filterQuality,
      webHtmlElementStrategy: WebHtmlElementStrategy.prefer,
      loadingBuilder: placeholder == null
          ? null
          : (c, child, progreso) => progreso == null ? child : placeholder!(c),
      errorBuilder: (c, _, _) =>
          errorWidget?.call(c) ?? SizedBox(width: width, height: height),
    ));
  }
}
