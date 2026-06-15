import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

import '../models/itinerary_model.dart';

class ItineraryDB {
  static Database? _db;

  static Future<Database> get _database async {
    _db ??= await _open();
    return _db!;
  }

  static Future<Database> _open() async {
    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'smartur_itineraries.db');
    return openDatabase(
      path,
      version: 2,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE itineraries (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            cover_image_url TEXT,
            is_public INTEGER NOT NULL DEFAULT 0,
            is_certified INTEGER NOT NULL DEFAULT 0,
            original_itinerary_id INTEGER,
            copy_count INTEGER NOT NULL DEFAULT 0,
            view_count INTEGER NOT NULL DEFAULT 0,
            owner_name TEXT,
            owner_avatar_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE itinerary_stops (
            id INTEGER PRIMARY KEY,
            itinerary_id INTEGER NOT NULL,
            place_kind TEXT NOT NULL,
            place_id INTEGER NOT NULL,
            stop_order INTEGER NOT NULL,
            visit_date TEXT,
            visit_time_start TEXT,
            notes TEXT,
            place_name TEXT,
            place_image_url TEXT,
            place_lat REAL,
            place_lon REAL,
            contact_phone TEXT,
            id_company INTEGER,
            FOREIGN KEY (itinerary_id) REFERENCES itineraries (id) ON DELETE CASCADE
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await db.execute('ALTER TABLE itinerary_stops ADD COLUMN contact_phone TEXT');
          await db.execute('ALTER TABLE itinerary_stops ADD COLUMN id_company INTEGER');
        }
      },
    );
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  static Future<void> saveItinerary(Itinerary it) async {
    final db = await _database;
    await db.insert(
      'itineraries',
      it.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    // Delete old stops for this itinerary then re-insert
    await db.delete('itinerary_stops',
        where: 'itinerary_id = ?', whereArgs: [it.id]);
    for (final stop in it.stops) {
      await db.insert(
        'itinerary_stops',
        stop.toMap()..['itinerary_id'] = it.id,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  static Future<void> saveItineraries(List<Itinerary> list) async {
    for (final it in list) {
      await saveItinerary(it);
    }
  }

  static Future<void> deleteItinerary(int id) async {
    final db = await _database;
    await db.delete('itinerary_stops',
        where: 'itinerary_id = ?', whereArgs: [id]);
    await db.delete('itineraries', where: 'id = ?', whereArgs: [id]);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  static Future<Itinerary?> getItinerary(int id) async {
    final db = await _database;
    final rows = await db.query('itineraries', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    final it = Itinerary.fromMap(rows.first);
    final stops = await _stopsFor(db, id);
    return it.copyWith(stops: stops);
  }

  static Future<List<Itinerary>> getMyItineraries(int userId) async {
    final db = await _database;
    final rows = await db.query(
      'itineraries',
      where: 'user_id = ?',
      whereArgs: [userId],
      orderBy: 'updated_at DESC',
    );
    final result = <Itinerary>[];
    for (final row in rows) {
      final it = Itinerary.fromMap(row);
      final stops = await _stopsFor(db, it.id);
      result.add(it.copyWith(stops: stops));
    }
    return result;
  }

  static Future<List<ItineraryStop>> _stopsFor(Database db, int itId) async {
    final rows = await db.query(
      'itinerary_stops',
      where: 'itinerary_id = ?',
      whereArgs: [itId],
      orderBy: 'stop_order ASC',
    );
    return rows.map(ItineraryStop.fromMap).toList();
  }
}
