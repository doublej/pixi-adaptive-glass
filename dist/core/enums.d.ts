export declare enum SurfaceShapeType {
    CIRCLE = "circle",
    SQUIRCLE = "squircle",
    CONCAVE = "concave",
    LIP = "lip",
    DOME = "dome",
    WAVE = "wave",
    FLAT = "flat",
    RAMP = "ramp"
}
export declare enum DebugMode {
    OFF = 0,
    EDGE_DISTANCE = 1,
    SHAPE_MASK = 2,
    NORMALS = 3
}
export declare enum CapabilityTierType {
    WEBGL2 = "webgl2",
    WEBGL1 = "webgl1"
}
export declare enum AdaptiveActionType {
    SCALE_RT_085 = "scale-rt-0-85",
    SCALE_RT_070 = "scale-rt-0-7",
    REDUCE_BLUR = "reduce-blur",
    DISABLE_DISPERSION = "disable-dispersion",
    DISABLE_CAUSTICS = "disable-caustics",
    FALLBACK_WEBGL1 = "fallback-webgl1"
}
export declare const PARAM_RANGES: {
    readonly ior: {
        readonly min: 1;
        readonly max: 2;
        readonly default: 1.45;
        readonly step: 0.01;
    };
    readonly thickness: {
        readonly min: 0;
        readonly max: 10;
        readonly default: 1;
        readonly step: 0.1;
    };
    readonly roughness: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.1;
        readonly step: 0.01;
    };
    readonly dispersion: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly opacity: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 1;
        readonly step: 0.01;
    };
    readonly specular: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.3;
        readonly step: 0.01;
    };
    readonly shininess: {
        readonly min: 1;
        readonly max: 256;
        readonly default: 64;
        readonly step: 1;
    };
    readonly shadow: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.2;
        readonly step: 0.01;
    };
    readonly blurSamples: {
        readonly min: 3;
        readonly max: 32;
        readonly default: 8;
        readonly step: 1;
    };
    readonly blurSpread: {
        readonly min: 0;
        readonly max: 20;
        readonly default: 5;
        readonly step: 0.1;
    };
    readonly blurAngle: {
        readonly min: 0;
        readonly max: 360;
        readonly default: 0;
        readonly step: 1;
    };
    readonly blurAnisotropy: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly blurGamma: {
        readonly min: 0.5;
        readonly max: 3;
        readonly default: 1;
        readonly step: 0.1;
    };
    readonly aberrationR: {
        readonly min: 0.5;
        readonly max: 1.5;
        readonly default: 1;
        readonly step: 0.01;
    };
    readonly aberrationB: {
        readonly min: 0.5;
        readonly max: 1.5;
        readonly default: 1;
        readonly step: 0.01;
    };
    readonly ao: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly aoRadius: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.5;
        readonly step: 0.01;
    };
    readonly noiseScale: {
        readonly min: 1;
        readonly max: 100;
        readonly default: 10;
        readonly step: 1;
    };
    readonly noiseIntensity: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly noiseRotation: {
        readonly min: 0;
        readonly max: 360;
        readonly default: 0;
        readonly step: 1;
    };
    readonly noiseThreshold: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly glassSupersampling: {
        readonly min: 1;
        readonly max: 4;
        readonly default: 1;
        readonly step: 1;
    };
    readonly edgeIorRangeStart: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly edgeIorRangeEnd: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.3;
        readonly step: 0.01;
    };
    readonly edgeIorStrength: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.5;
        readonly step: 0.01;
    };
    readonly edgeMaskCutoff: {
        readonly min: 0;
        readonly max: 0.1;
        readonly default: 0;
        readonly step: 0.001;
    };
    readonly edgeMaskBlur: {
        readonly min: 0;
        readonly max: 5;
        readonly default: 0;
        readonly step: 0.1;
    };
    readonly tacticRangeStart: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly tacticRangeEnd: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.3;
        readonly step: 0.01;
    };
    readonly tacticStrength: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.5;
        readonly step: 0.01;
    };
    readonly tacticOpacity: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 1;
        readonly step: 0.01;
    };
    readonly lightSmoothing: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.9;
        readonly step: 0.01;
    };
    readonly lightDelay: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.5;
        readonly step: 0.01;
    };
    readonly lightCurve: {
        readonly min: 0.5;
        readonly max: 3;
        readonly default: 1.5;
        readonly step: 0.1;
    };
    readonly lightZMin: {
        readonly min: 0;
        readonly max: 0.5;
        readonly default: 0.05;
        readonly step: 0.01;
    };
    readonly lightZMax: {
        readonly min: 0;
        readonly max: 0.5;
        readonly default: 0.2;
        readonly step: 0.01;
    };
    readonly lightEdgeStretch: {
        readonly min: 0.1;
        readonly max: 2;
        readonly default: 0.5;
        readonly step: 0.1;
    };
    readonly cornerRadius: {
        readonly min: 0;
        readonly max: 200;
        readonly default: 20;
        readonly step: 1;
    };
    readonly bevelSize: {
        readonly min: 0;
        readonly max: 100;
        readonly default: 12;
        readonly step: 1;
    };
    readonly renderScale: {
        readonly min: 0.5;
        readonly max: 1;
        readonly default: 1;
        readonly step: 0.05;
    };
    readonly maxBlurTaps: {
        readonly min: 4;
        readonly max: 32;
        readonly default: 16;
        readonly step: 1;
    };
    readonly edgeSupersampling: {
        readonly min: 1;
        readonly max: 4;
        readonly default: 1;
        readonly step: 1;
    };
    readonly lightDirX: {
        readonly min: -1;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly lightDirY: {
        readonly min: -1;
        readonly max: 1;
        readonly default: 0;
        readonly step: 0.01;
    };
    readonly lightDirZ: {
        readonly min: 0;
        readonly max: 1;
        readonly default: 0.15;
        readonly step: 0.01;
    };
};
export type ParamKey = keyof typeof PARAM_RANGES;
