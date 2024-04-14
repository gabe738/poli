function getTime() {
    const d = new Date()
    const s = d.toISOString()
    const year = s.substring(0,4)
    const month = s.substring (5,7)
    const day = s.substring(8,10)
    const hour = s.substring(11,13)
    const minute = s.substring(14,16)
    const second = s.substring(17,19)
    let ms = Date.UTC(year, month, day, hour, minute, second);
    // console.log(ms)
    return ms
}

module.exports = {
    getTime: getTime
}