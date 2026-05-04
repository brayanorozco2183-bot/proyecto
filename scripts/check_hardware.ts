import { getHardwareProfile, formatHardwareProfile } from '../src/ai/hardwareProfile.js';

const profile = getHardwareProfile();
console.log('--- PERFIL DE HARDWARE DETECTADO ---');
console.log(formatHardwareProfile(profile));
console.log('------------------------------------');

if (profile.totalRamGb < 8) {
    console.log('⚠️ ADVERTENCIA: Tienes muy poca memoria RAM.');
}
if (profile.gpuVramGb === 0) {
    console.log('⚠️ ADVERTENCIA: GPU_VRAM_GB no configurada en el .env');
}
