"use strict";

class meshData {
    static parseOBJ(text) {
        const objPositions = [[0, 0, 0]];
        const objTexcoords = [[0, 0]];
        const objNormals = [[0, 0, 0]];
        const objColors = [[0, 0, 0]];

        const objVertexData = [
            objPositions,
            objTexcoords,
            objNormals,
            objColors,
        ];

        // same order as `f` indices
        let webglVertexData = [
            [],
            [],
            [],
            [],
        ];

        const materialLibs = [];
        const geometries = [];
        let geometry;
        let groups = ['default'];
        let material = 'default';
        let object = 'default';

        const noop = () => {};

        function newGeometry() {
            if (geometry && geometry.data.position.length) {
                geometry = undefined;
            }
        }

        function setGeometry() {
            if (!geometry) {
                const position = [];
                const texcoord = [];
                const normal = [];
                const color = [];
                webglVertexData = [
                    position,
                    texcoord,
                    normal,
                    color,
                ];
                geometry = {
                    object,
                    groups,
                    material,
                    data: {
                        position,
                        texcoord,
                        normal,
                        color,
                    },
                };
                geometries.push(geometry);
            }
        }

        function addVertex(vert) {
            const ptn = vert.split('/');
            ptn.forEach((objIndexStr, i) => {
                if (!objIndexStr) {
                    return;
                }
                const objIndex = parseInt(objIndexStr);
                const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
                webglVertexData[i].push(...objVertexData[i][index]);

                if (i === 0 && objColors.length > 1) {
                    geometry.data.color.push(...objColors[index]);
                }
            });
        }

        const keywords = {
            v(parts) {
                if (parts.length > 3) {
                    objPositions.push(parts.slice(0, 3).map(parseFloat));

                    const color = parts.slice(3).map(parseFloat);
                    color.push(1);

                    objColors.push(new Uint8Array(color.map(function(element) {
                        return element * 255;
                    })));
                } else {
                    objPositions.push(parts.map(parseFloat));
                }
            },
            vn(parts) {
                objNormals.push(parts.map(parseFloat));
            },
            vt(parts) {
                // should check for missing v and extra w?
                objTexcoords.push(parts.slice(0, 2).map(parseFloat));
            },
            f(parts) {
                setGeometry();
                const numTriangles = parts.length - 2;
                for (let tri = 0; tri < numTriangles; ++tri) {
                    addVertex(parts[0]);
                    addVertex(parts[tri + 1]);
                    addVertex(parts[tri + 2]);
                }
            },
            s: noop,    // smoothing group
            mtllib(parts, unparsedArgs) {
                // the spec says there can be multiple filenames here
                // but many exist with spaces in a single filename
                materialLibs.push(unparsedArgs);
            },
            usemtl(parts, unparsedArgs) {
                material = unparsedArgs;
                newGeometry();
            },
            g(parts) {
                groups = parts;
                newGeometry();
            },
            o(parts, unparsedArgs) {
                object = unparsedArgs;
                newGeometry();
            },
        };

        const keywordRE = /(\w*)(?: )*(.*)/;
        const lines = text.split('\n');
        for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
            const line = lines[lineNo].trim();
            if (line === '' || line.startsWith('#')) {
                continue;
            }
            const m = keywordRE.exec(line);
            if (!m) {
                continue;
            }
            const [, keyword, unparsedArgs] = m;
            const parts = line.split(/\s+/).slice(1);
            const handler = keywords[keyword];
            if (!handler) {
                console.warn('unhandled keyword:', keyword);
                continue;
            }
            handler(parts, unparsedArgs);
        }

        for (const geometry of geometries) {
            geometry.data = Object.fromEntries(
                Object.entries(geometry.data)
                    .filter(([, array]) => array.length > 0));
        }

        return {
            geometries,
            materialLibs,
        };
    }

    static convertTypedArray(src, type) {
        const buffer = new ArrayBuffer(src.byteLength);
        const baseView = new src.constructor(buffer).set(src);
        return new type(buffer);
    }

    static createMesh(gl, objText) {
        console.log(objText);
        const object = this.parseOBJ(objText)

        console.log(object);

        return object.geometries.map(({data}) => {


            data = shapesInfo.makeDefaultVertexColors(data, {
                vertsPerColor: 6
            });

            //data.color = new Uint8Array(data.color);

            console.log(data);

            const bufferInfo = utils.createBufferInfoFromArrays(gl, data);
            console.log(bufferInfo);
            return bufferInfo;
        });
    }
}
