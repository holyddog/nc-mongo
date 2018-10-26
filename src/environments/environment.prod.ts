export const environment = {
    production: true,
    client_id: 'web',
    client_secret: '5GRSFXRn1yI8q5uFwGF53ibYHQyeGPfr'
};

var host = window.location.host;
declare var AppConfig: any;
export const Config = {
    AppName: 'NC BOM',
    PageSize: 10,
    
    ServiceUrl: AppConfig.ServiceUrl,
    AuthenUrl: AppConfig.AuthenUrl,
    FileUrl: AppConfig.FileUrl,
    ImageUrl: 'http://203.154.51.244:85/files',

    // ServiceUrl: 'http://203.154.51.242',
    // AuthenUrl: 'http://203.154.51.241/Pro/SPOnlineService',
    // FileUrl: 'http://203.154.51.242/files',
    // ImageUrl: 'http://203.154.51.242/files',

    StoragePrefix: 'ncMongo-'
};