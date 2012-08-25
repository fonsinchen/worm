exports = function(descriptor) {
    // TODO parse, create chid descriptors
    return {
        renderSelect : function(driver) {},
        renderUpdate : function(driver) {},
        renderInsert : function(driver) {},
        renderDelete : function(driver) {}, // semantic is unclear: only delete from master table or from all?
        extract : function(result) {} // called once for each row 
    }
}