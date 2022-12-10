module.exports = (ctx) => ({
	map: ctx.options.map,
	plugins: {
		'postcss-import': { root: ctx.file.dirname },
		'postcss-preset-env': {
			stage: 0,
			minimumVendorImplementations: 0,
		}
	},
})
