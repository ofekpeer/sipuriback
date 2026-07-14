const outputSchema = `

Return ONLY valid JSON.

Do not return markdown.

Do not explain anything.

Return exactly this structure.

{

"title":"",

"cover":{

"title":"",

"imagePrompt":""

},

"pages":[

{

"page":1,

"text":"",

"imagePrompt":""

}

],

"summary":"",

"moral":""

}

`;

export default outputSchema;
