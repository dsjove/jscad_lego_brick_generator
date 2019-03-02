/*
// Install..
git clone https://github.com/jscad/OpenJSCAD.org
cd OpenJSCAD.org/packages/desktop
npm i

// Run
npm run dev
// 'load jscad project' this file

// API
https://openjscad.org/dokuwiki/doku.php?id=start
https://openjscad.org
*/

function main () {
    // LEGO Constants
    const lu = 1.6
    const plate = lu * 2
    const brick = lu * 6
    const unit = lu * 5
    const wall = lu * 1
    const stud = lu * 3
    const stud_height = lu * 1
    const stud_hole = lu * 2
    const clutch_big_diam = 6.5
    const clutch_support = 0.4
    const ridge_width = 0.3
    const ridge_height = 0.3

    // Part Design
    var unit_w = 1
    var unit_l = 2
    var unit_h = 3
    
    var do_studs = true
    var do_wall = true
    var do_clutches = true
    var do_ridge = true

    // TODO: Axle holes
    // TODO: Side pin holes
    // TODO: dot form
    
    var rounded_corners = true
    var offset_studs_w = true
    var offset_studs_l = true

    var holey_studs = true
    var holey_ceiling = true
    var holey_clutches = false 
    
    var do_small_clutch_support = true 
    
    // Tolerances (all expressed as positive)
    var inside_tolerance = 0
    var outer_tolerance = 0
    var stud_tolerance = 0
    var stud_height_tolerance = 0
    var stud_hole_tolerance = 0
    var clutch_tolerance = 0

    // Validation
    if (unit_w <= 0) {
        unit_w = 1
    }

    if (unit_l <= 0) {
        unit_l = 1
    }

    if (unit_h < 0) {
        unit_h = 0
    }

    if (unit_h == 0) {
        do_wall = false
    }

    if (do_wall == false) {
        do_ridge = false
    }

    if (offset_studs_w && unit_w == 1) {
        offset_studs_w = false
    }

    if (offset_studs_l && unit_l == 1) {
        offset_studs_l = false
    }

    if (do_clutches && unit_h == 0) {
        do_clutches = false
    }

    if (holey_clutches && do_studs && (offset_studs_w || offset_studs_l)) {
        holey_clutches = false
    }

    if (holey_clutches && (unit_w == 1 || unit_l == 1) && do_clutches) {
        holey_clutches = false
    }

    if (do_small_clutch_support && unit_h <= 1) {
        do_small_clutch_support = false
    }

    if (do_small_clutch_support && do_wall == false) {
        do_small_clutch_support = false
    }

    if (holey_ceiling && do_clutches && (unit_w == 1 || unit_l == 1) && (offset_studs_w || offset_studs_l)) {
        holey_ceiling = false
    }

    // Calculated
    const width = unit_w * unit
    const length = unit_l * unit
    const thickness = wall - inside_tolerance
    const height = unit_h > 0 ? unit_h * plate : thickness
    const studh = stud_height-stud_height_tolerance
    const clutch_height = height - thickness - stud_height_tolerance
    const actual_width = width - outer_tolerance * 2
    const actual_length = length - outer_tolerance * 2

    var accume
    
    // Structure
    if (unit_h > 0) {
        if (do_wall) {
            const struct = cube({size: [actual_width, actual_length, height], center: true})
            
            const hollow = cube({size: [width - thickness*2, length - thickness*2, height-thickness], center: true})
                .translate([0, 0, -thickness + thickness/2])
                
            accume = difference(struct, hollow)
        }
        else {
            accume = cube({size: [actual_width, actual_length, thickness], center: true})
                .translate([0, 0, height/2 - thickness/2])
        }
    }
    else {
        accume = cube({size: [actual_width, actual_length, height], center: true})
    }
    
    if (do_ridge) {
        const z = -height/2 + ridge_height/2
        const ridge1 = cube({size: [actual_width,  ridge_width, ridge_height], center: true})
            .translate([0, -actual_length/2 + ridge_height/2, z])
        const ridge2 = cube({size: [actual_width,  ridge_width, ridge_height], center: true})
            .translate([0, +actual_length/2 - ridge_height/2, z])
        const ridge3 = cube({size: [ridge_width, actual_length, ridge_height], center: true})
            .translate([-actual_width/2 + ridge_height/2, 0, z])
        const ridge4 = cube({size: [ridge_width, actual_length, ridge_height], center: true})
            .translate([+actual_width/2 - ridge_height/2, 0, z])

        accume = difference(accume, ridge1, ridge2, ridge3, ridge4)
    }
  
    if (rounded_corners) {
        const d1 = unit/2 - outer_tolerance
        const d2 = unit/2 - thickness
        const h = do_wall ? height : thickness
        const z = do_wall ? 0 : height/2 - thickness/2
        const block = cube({size: [d1, d1, h], center: true})
        const outer_curve = cylinder({r: d1, h: h, center: true})
             .translate([d1/2, d1/2, 0])
        const inner_curve = cylinder({r: d2, h: height, center: true})
             .translate([d1/2, d1/2, 0])

        const outer = difference(block, outer_curve)

        const wo = actual_width/2 - d1/2
        const lo = actual_length/2 - d1/2
 
        const o1 = rotate([0, 0, 0],   outer).translate([-wo, -lo, z])
        const o2 = rotate([0, 0, 90],  outer).translate([wo, -lo, z])
        const o3 = rotate([0, 0, 180], outer).translate([wo, lo, z])
        const o4 = rotate([0, 0, 270], outer).translate([-wo, lo, z])

        accume = difference(accume, o1, o2, o3, o4)

        const inner = difference(intersection(block, outer_curve), inner_curve)
 
        const i1 = rotate([0, 0, 0],   inner).translate([-wo, -lo, z])
        const i2 = rotate([0, 0, 90],  inner).translate([wo, -lo, z])
        const i3 = rotate([0, 0, 180], inner).translate([wo, lo, z])
        const i4 = rotate([0, 0, 270], inner).translate([-wo, lo, z])

        accume = union(accume, i1, i2, i3, i4)

        if (do_ridge) {
            const d3 = unit/2 - ridge_width-outer_tolerance
            const ridge_block = cube({size: [d1, d1, ridge_height], center: true})
                .translate([0, 0, -height/2 + ridge_height/2])
            const ridge_curve = cylinder({r: d3, h: ridge_height, center: true})
                .translate([d1/2, d1/2, -height/2 + ridge_height/2])

            const ridge = difference(ridge_block, ridge_curve)

            const r1 = rotate([0, 0, 0],   ridge).translate([-wo, -lo, z])
            const r2 = rotate([0, 0, 90],  ridge).translate([wo, -lo, z])
            const r3 = rotate([0, 0, 180], ridge).translate([wo, lo, z])
            const r4 = rotate([0, 0, 270], ridge).translate([-wo, lo, z])
            accume = difference(accume, r1, r2, r3, r4)
        }
    }
    
    if (holey_ceiling) {
        const hollow = cylinder({r: stud_hole/2 + stud_hole_tolerance, h: thickness, center: true})
        const wo = offset_studs_w ? 0 : unit/2
        const lo = offset_studs_l ? 0 : unit/2
        var w = offset_studs_w ? 1 :0
        for (; w < unit_w; w++) {
            var l = offset_studs_l ? 1 :0
            for (; l < unit_l; l++) {
                const x = -width/2 + wo + unit*w
                const y = -length/2 + lo + unit*l
                const z = height/2 - thickness/2
                accume = difference(accume, hollow.translate([x, y, z]))
            }
        }
    }
            
    if (do_studs) {
        var bumb = cylinder({r: stud/2-stud_tolerance, h: studh, center: true})
        if (holey_studs) {
            const bumbHollow = cylinder({r: stud_hole/2 + stud_hole_tolerance, h: studh, center: true})
            bumb = difference(bumb, bumbHollow)
        }
        const wo = offset_studs_w ? 0 : unit/2
        const lo = offset_studs_l ? 0 : unit/2
        var w = offset_studs_w ? 1 :0
        for (; w < unit_w; w++) {
            var l = offset_studs_l ? 1 :0
            for (l; l < unit_l; l++) {
                const x = -width/2 + wo + unit*w
                const y = -length/2 + lo + unit*l
                const z = height/2 + studh/2
                accume = union(accume, bumb.translate([x, y, z]))
            }
        }
    }
    
    if (holey_clutches) {
        if (unit_w > 1 && unit_l > 1) {
            const hollow = cylinder({r: stud/2 + stud_hole_tolerance, h: thickness, center: true})
            var w = 1
            for (w; w < unit_w; w++) {
                var l = 1
                for (; l < unit_l; l++) {
                    const x = -width/2 + unit*w
                    const y = -length/2 + unit*l
                    const z = height/2 - thickness/2
                    accume = difference(accume, hollow.translate([x, y, z]))
                }
            }
        }
        else {
            const hollow = cylinder({r: stud_hole/2 + stud_hole_tolerance, h: thickness, center: true})
            if (unit_w > 1) {
                var w = 1
                for (; w < unit_w; w++) {
                    const x = -width/2 + unit*w
                    const y = 0
                    const z = height/2 - thickness/2
                    accume = difference(accume, hollow.translate([x, y, z]))
                }
            }
            else if (unit_l > 1) {
                var l = 1
                for (; l < unit_l; l++) {
                    const x = 0
                    const y = -length/2 + unit*l
                    const z = height/2 - thickness/2
                    accume = difference(accume, hollow.translate([x, y, z]))
                }
            }
        }
    }
    
    if (do_clutches) {
        if (unit_w > 1 && unit_l > 1) {
            var clutch = cylinder({r: clutch_big_diam/2 - clutch_tolerance, h: clutch_height, center: true})
            var clutch_hollow = cylinder({r: stud/2 + stud_hole_tolerance, h: clutch_height, center: true})
            clutch = difference(clutch, clutch_hollow)
            var w = 1
            for (; w < unit_w; w++) {
                var l = 1
                for (; l < unit_l; l++) {
                    const x = -width/2 + unit*w
                    const y = -length/2 + unit*l
                    const z = -height/2 + clutch_height/2
                    accume = union(accume, clutch.translate([x, y, z]))
                }
            }
        }
        else if (unit_w > 1) {
            var clutch = cylinder({r: stud_hole/2 - clutch_tolerance, h: clutch_height, center: true})
            if (do_small_clutch_support && unit_h > 1) {
                const support = cube({size: [clutch_support, length, clutch_height - stud_height], center: true})
                    .translate([0, 0, stud_height/2])
                clutch = union(clutch, support)
            }
            var w = 1
            for (; w < unit_w; w++) {
                const x = -width/2 + unit*w
                const y = 0
                const z = -height/2 + clutch_height/2
                accume = union(accume, clutch.translate([x, y, z]))
            }
        }
        else if (unit_l > 1) {
            var clutch = cylinder({r: stud_hole/2 - clutch_tolerance, h: clutch_height, center: true})
            if (do_small_clutch_support && unit_h > 1) {
                const support = cube({size: [width, clutch_support, clutch_height - stud_height], center: true})
                    .translate([0, 0, stud_height/2])
                clutch = union(clutch, support)
            }
            var l = 1
            for (; l < unit_l; l++) {
                const x = 0
                const y = -length/2 + unit*l
                const z = -height/2 + clutch_height/2
                accume = union(accume, clutch.translate([x, y, z]))
            }
        }
    }
    return accume.translate([0, 0, height/2])
}
