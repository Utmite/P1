#!/usr/bin/env python3
"""
Script para descargar automáticamente los sonidos de aves de Chile desde Xeno-canto
Requiere: requests, beautifulsoup4
Instalación: pip install requests beautifulsoup4
"""

import os
import sys
import json
import requests
from urllib.parse import urljoin

# Mapeo de especies (nombre científico -> nombre de archivo)
ESPECIES = {
    'Phoenicopterus chilensis': 'flamenco_chileno.mp3',
    'Phoenicoparrus andinus': 'parina_grande.mp3',
    'Haematopus palliatus': 'pilpilen.mp3',
    'Vultur gryphus': 'condor_andino.mp3',
    'Leistes loyca': 'loica.mp3',
    'Diuca diuca': 'diuca.mp3',
    'Zonotrichia capensis': 'chincol.mp3',
    'Vanellus chilensis': 'queltehue.mp3',
    'Theristicus melanopis': 'bandurria.mp3',
    'Caracara plancus': 'traro.mp3',
    'Scelorchilus rubecula': 'chucao.mp3',
    'Aphrastura spinicauda': 'rayadito.mp3',
    'Pteroptochos tarnii': 'huet_huet.mp3',
    'Megaceryle torquata': 'martin_pescador.mp3',
    'Campephilus magellanicus': 'carpintero_negro.mp3',
    'Spheniscus magellanicus': 'pinguino_magallanes.mp3'
}

def download_bird_sound(species_name, output_filename, sounds_dir='sounds'):
    """
    Descarga el sonido de un ave desde la API de Xeno-canto
    """
    print(f"\n🔍 Buscando: {species_name}...")
    
    # API de Xeno-canto
    api_url = f"https://xeno-canto.org/api/2/recordings?query={species_name}+cnt:chile"
    
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
        
        recordings = data.get('recordings', [])
        
        if not recordings:
            print(f"❌ No se encontraron grabaciones para {species_name}")
            return False
        
        # Filtrar por calidad (A o B) y ordenar
        quality_recordings = [r for r in recordings if r.get('q') in ['A', 'B']]
        
        if not quality_recordings:
            # Si no hay de calidad A o B, usar cualquiera
            quality_recordings = recordings
        
        # Tomar la primera grabación de buena calidad
        recording = quality_recordings[0]
        audio_url = recording.get('file')
        
        if not audio_url:
            print(f"❌ No se encontró URL de audio para {species_name}")
            return False
        
        # Asegurar que la URL sea completa
        if not audio_url.startswith('http'):
            audio_url = f"https:{audio_url}"
        
        print(f"📥 Descargando desde: {audio_url}")
        print(f"   Calidad: {recording.get('q', 'N/A')} | Duración: {recording.get('length', 'N/A')}s")
        
        # Descargar el archivo
        audio_response = requests.get(audio_url, stream=True)
        audio_response.raise_for_status()
        
        # Crear directorio si no existe
        os.makedirs(sounds_dir, exist_ok=True)
        
        # Guardar el archivo
        output_path = os.path.join(sounds_dir, output_filename)
        with open(output_path, 'wb') as f:
            for chunk in audio_response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = os.path.getsize(output_path) / 1024  # KB
        print(f"✅ Guardado: {output_filename} ({file_size:.1f} KB)")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al descargar {species_name}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado con {species_name}: {e}")
        return False

def main():
    print("=" * 60)
    print("🐦 DESCARGADOR DE SONIDOS DE AVES DE CHILE")
    print("=" * 60)
    print(f"Total de especies a descargar: {len(ESPECIES)}")
    print("Fuente: Xeno-canto (xeno-canto.org)")
    print("-" * 60)
    
    success_count = 0
    failed = []
    
    for i, (species, filename) in enumerate(ESPECIES.items(), 1):
        print(f"\n[{i}/{len(ESPECIES)}] {filename}")
        
        if download_bird_sound(species, filename):
            success_count += 1
        else:
            failed.append(species)
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE DESCARGA")
    print("=" * 60)
    print(f"✅ Exitosas: {success_count}/{len(ESPECIES)}")
    print(f"❌ Fallidas: {len(failed)}/{len(ESPECIES)}")
    
    if failed:
        print("\n❌ No se pudieron descargar:")
        for species in failed:
            print(f"   - {species}")
        print("\n💡 Intenta descargarlas manualmente desde:")
        print("   https://www.xeno-canto.org/")
    else:
        print("\n🎉 ¡Todas las grabaciones descargadas exitosamente!")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Descarga interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error fatal: {e}")
        sys.exit(1)

