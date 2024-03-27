import qrcode from 'qrcode';


export const qrCodeGenetation = async (data)=>{
   const generatedQrCode = await  qrcode.toDataURL(JSON.stringify(data) , 
    { errorCorrectionLevel: 'H' })
    return generatedQrCode
}

