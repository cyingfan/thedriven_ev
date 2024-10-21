(async function() {
  const resp = await fetch('https://thedriven.io/ev-models/')
  const html: string = await resp.text()
  const parts = html.split("<h1 id")
  const availabilities = { "Available Now": parts[1], "Coming Soon": parts[2], "Second Hand": parts[3] }
  Object.entries(availabilities).forEach(([availability, availability_html]) => {
    const table_regex = /<table[^>]*>(.*?)<\/table[^>]*>/gsi
    const table_matches = availability_html.matchAll(table_regex)
    const rows = [...table_matches].map(table => {
      const row_regex = /<tr>.*?<td>(.*?)<\/td>.*?<td>(.*?)<\/td>.*?<td>(.*?)<\/td>.*?<td>(.*?)<\/td>.*?<\/tr>/gsi
      const row_matches = table[1].matchAll(row_regex)
      return [...row_matches].map(row => [row[1], row[2], row[3], row[4]])
    }).flat()
    rows.forEach(row => {
      const trim_regex = /[^\d\.]+/g
      const price = parseInt(row[1].replace(trim_regex, '')) || 'TBA'
      const range = parseInt(row[2].replace(trim_regex, '')) || 'TBA'
      const battery = parseInt(row[3].replace(trim_regex, '')) || 'TBA'
      const line = `${availability},${row[0]},${price},${range},${battery}`
      console.log(line)
    })
  });
})();
