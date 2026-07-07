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
// build.gradle solo fija sourceCompatibility=1.8 en Java pero deja que Kotlin
// use el JDK del toolchain (17), causando "Inconsistent JVM Target
// Compatibility" al compilar). El módulo :app ya estaba en 17; esto alinea
// al resto para que coincidan.
subprojects {
    tasks.withType<JavaCompile>().configureEach {
        sourceCompatibility = "17"
        targetCompatibility = "17"
    }
    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
        compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
