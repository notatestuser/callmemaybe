function extend() {
	Array.prototype.intersect = function(other) {
		return this.filter(function(item) {
			return ~other.indexOf(item)
		})
	}
}

module.exports.extend = extend
