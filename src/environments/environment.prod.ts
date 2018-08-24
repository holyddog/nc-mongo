export const environment = {
    production: true,
    client_id: 'web',
    client_secret: '5GRSFXRn1yI8q5uFwGF53ibYHQyeGPfr'
};

var host = window.location.host;

export const Config = {
    AppName: 'NC BOM',
    PageSize: 10,

    ServiceUrl: 'http://27.254.138.120:3208',
    AuthenUrl: 'http://27.254.138.120:3201/dev/ecv/POS-OnlineService',
    FileUrl: 'http://27.254.138.120:3208/files',
    ImageUrl: 'http://27.254.138.120:3203/files',
    
    // ServiceUrl: 'http://203.154.51.242',
    // AuthenUrl: 'http://203.154.51.241/Pro/SPOnlineService',
    // FileUrl: 'http://203.154.51.242/files',
    // ImageUrl: 'http://203.154.51.242/files',

    StoragePrefix: 'ncMongo-'
};