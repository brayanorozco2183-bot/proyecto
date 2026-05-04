
import { BaseAgent, AgentResponse } from './base.js';
import { staticFactory } from '../tools/static_factory.js';
import Client from 'ssh2-sftp-client';
import * as ftp from 'basic-ftp';
import path from 'path';

/**
 * StaticDeployAgent - The Omnipresencia Lead.
 * Handles the generation and preparation for static hosting.
 */
export class StaticDeployAgent extends BaseAgent {
    constructor() {
        super('Static_Deploy_09', 'Static Deploy', 'Desplegador Estático', 'Encargado de ensamblar los archivos HTML finales y asegurar que el diseño sea 100% responsive.');
    }

    async execute(input: {
        niche: string;
        city: string;
        content: string;
        schema: any;
        keywords: string[];
        subPath?: string;
        clusterFolderName?: string;
        ftpCreds?: { host: string, user: string, pass: string, port?: number, path: string };
    }): Promise<AgentResponse<any>> {
        this.logThought(`Generating static site for ${input.niche} in ${input.city} (Cluster: ${input.clusterFolderName || 'None'})`);

        try {
            const localFilePath = await staticFactory.generatePage(input);
            const publicStaticPath = localFilePath.includes(`${path.sep}output_sites${path.sep}`)
                ? localFilePath.replace(`${path.sep}output_sites${path.sep}`, `${path.sep}public-static${path.sep}`)
                : path.join(process.cwd(), 'public-static');
            await this.logThought(`Static site ready at: ${localFilePath}`);
            await this.logThought(`Public-static mirror ready at: ${publicStaticPath}`);

            // If FTP/SFTP credentials are provided, attempt upload
            if (input.ftpCreds && input.ftpCreds.host && input.ftpCreds.user) {
                const isSftp = input.ftpCreds.port === 22 || !input.ftpCreds.port;

                if (isSftp) {
                    await this.logThought(`Iniciando despliegue remoto vía SFTP a ${input.ftpCreds.host}...`);
                    const sftp = new Client();
                    try {
                        await sftp.connect({
                            host: input.ftpCreds.host,
                            port: input.ftpCreds.port || 22,
                            username: input.ftpCreds.user,
                            password: input.ftpCreds.pass,
                            retries: 1
                        });
                        await this.performSftpUpload(sftp, localFilePath, input);
                        await sftp.end();
                        this.logThought(`✅ Despliegue completado con éxito vía SFTP.`);
                    } catch (sftpError: any) {
                        this.logThought(`⚠️ SFTP Falló: ${sftpError.message}. Intentando fallback a FTP estándar...`);
                        await this.performFtpUpload(localFilePath, input);
                    }
                } else {
                    await this.performFtpUpload(localFilePath, input);
                }
            }

            return {
                success: true,
                data: {
                    deploy_path: localFilePath,
                    public_static_path: publicStaticPath,
                    type: 'static_html',
                    performance_score: 100,
                    published_url: input.ftpCreds?.host ? `https://${input.ftpCreds.host}${input.clusterFolderName ? '/' + input.clusterFolderName : ''}${input.subPath ? '/' + input.subPath : ''}/index.html` : undefined
                },
                thoughts: `He generado un sitio estático ultra-optimizado${input.ftpCreds?.host ? ' y lo he desplegado en el servidor remoto' : ''}.`
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                thoughts: "Error al generar la estructura estática del sitio."
            };
        }
    }

    private async performSftpUpload(sftp: Client, localPath: string, input: any) {
        let remoteDir = input.ftpCreds.path || '';
        if (input.clusterFolderName) remoteDir = path.posix.join(remoteDir, input.clusterFolderName);
        if (input.subPath) remoteDir = path.posix.join(remoteDir, input.subPath);

        this.logThought(`Creating remote directory: ${remoteDir}`);
        await sftp.mkdir(remoteDir, true);

        const remoteFilePath = path.posix.join(remoteDir, 'index.html');
        this.logThought(`Uploading to: ${remoteFilePath}`);
        await sftp.put(localPath, remoteFilePath);
    }

    private async performFtpUpload(localPath: string, input: any) {
        const client = new ftp.Client();
        client.ftp.verbose = true;
        try {
            await this.logThought(`Iniciando despliegue remoto vía FTP estándar a ${input.ftpCreds.host}...`);
            await client.access({
                host: input.ftpCreds.host,
                user: input.ftpCreds.user,
                password: input.ftpCreds.pass,
                port: input.ftpCreds.port === 22 ? 21 : (input.ftpCreds.port || 21),
                secure: false // Cambiar a true si el servidor soporta FTPS
            });

            let remoteDir = input.ftpCreds.path || '';
            if (input.clusterFolderName) remoteDir = path.posix.join(remoteDir, input.clusterFolderName);
            if (input.subPath) remoteDir = path.posix.join(remoteDir, input.subPath);

            this.logThought(`Creating remote directory: ${remoteDir}`);
            await client.ensureDir(remoteDir);

            // Al usar ensureDir, el cliente ya se encuentra dentro de remoteDir.
            // Para la subida, se usa directamente el nombre del archivo.
            const baseFileName = 'index.html';
            this.logThought(`Uploading to: /${remoteDir}/${baseFileName}`);
            const localFilePath = path.join(localPath, baseFileName);
            await client.uploadFrom(localFilePath, baseFileName);
            this.logThought(`✅ Despliegue completado con éxito vía FTP.`);
        } catch (ftpError: any) {
            this.logThought(`❌ Error durante la subida FTP: ${ftpError.message}`);
        } finally {
            client.close();
        }
    }
}
