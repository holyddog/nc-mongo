export const environment = {
    production: false,
    client_id: 'web',
    client_secret: '5GRSFXRn1yI8q5uFwGF53ibYHQyeGPfr'
};

declare var AppConfig: any;
export const Config = {
    AppName: 'NC BOM (Development)',
    WSP: AppConfig.WSP,
    PageSize: 10,

    ServiceUrl: AppConfig.ServiceUrl,
    AuthenUrl: AppConfig.AuthenUrl,
    FileUrl: AppConfig.FileUrl,
    ExternalFileUrl: AppConfig.ExternalFileUrl,
    ImageUrl: 'http://27.254.138.120:3203/files',

    StoragePrefix: 'ncMongo-'
};