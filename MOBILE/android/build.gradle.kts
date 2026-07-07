plugins {
    // Google Services plugin — required for google-services.json / Firebase / Google Sign-In
    id("com.google.gms.google-services") version "4.4.1" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Fuerza JVM target 17 consistente en Java Y Kotlin para TODOS los módulos,
// incluyendo plugins de terceros (ej. flutter_facebook_auth, cuyo propio
// build.gradle fija sourceCompatibility=1.8 vía la extensión `android {}` de
// AGP — que es la fuente que AGP realmente usa al finalizar sus tareas javac,
// no las propiedades genéricas de JavaCompile). Se usa afterEvaluate para que
// esto corra DESPUÉS de que el build.gradle propio del subproyecto ya haya
// configurado su extensión android, garantizando que nuestro valor gane.
subprojects {
    // :app ya se evalúa temprano por evaluationDependsOn(":app") arriba, y ya
    // trae JVM 17 configurado en su propio build.gradle.kts — afterEvaluate
    // fallaría ahí ("project is already evaluated"), así que se excluye.
    if (project.name != "app") {
        afterEvaluate {
            extensions.findByType<com.android.build.gradle.BaseExtension>()?.apply {
                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_17
                    targetCompatibility = JavaVersion.VERSION_17
                }
            }
        }
    }
    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
        compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
