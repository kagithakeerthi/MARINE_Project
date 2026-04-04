import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Camera,
  Satellite,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const DetectionPage: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      setImage(files[0]);
      const url = URL.createObjectURL(files[0]);
      setPreview(url);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('file', image);

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/detect/debris', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Detection failed');

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Detection error:', error);
      setResult({
        error: true,
        message: 'Failed to process image. Please try again.',
        mockData: {
          debrisCount: Math.floor(Math.random() * 50) + 10,
          coveragePercentage: Math.random() * 20 + 5,
          confidence: Math.random() * 30 + 70,
          composition: [
            { name: 'Plastic', value: 35, color: '#fb7185' },
            { name: 'Fishing Nets', value: 25, color: '#0ea5e9' },
            { name: 'Wood', value: 20, color: '#78350f' },
            { name: 'Glass', value: 12, color: '#c7d2fe' },
            { name: 'Metal', value: 8, color: '#9ca3af' },
          ],
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const mockResults = result?.mockData || result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Debris Detection</h1>
              <p className="text-cyan-200 text-sm mt-1">Upload satellite or drone images for automated marine debris analysis</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-white/20 hover:border-cyan-400/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  {loading ? (
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  ) : image ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <Upload className="w-8 h-8 text-white" />
                  )}
                </div>

                <div>
                  <p className="text-xl font-semibold text-white mb-2">
                    {image ? 'Image Selected' : 'Upload Satellite Image'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {image
                      ? `${image.name} (${(image.size / 1024 / 1024).toFixed(2)} MB)`
                      : 'Drag & drop or click the button to select satellite or drone imagery'
                    }
                  </p>
                </div>

                {!image ? (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image File
                    </button>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <div className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        Drone
                      </div>
                      <div className="flex items-center gap-1">
                        <Satellite className="w-3 h-3" />
                        Satellite
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 text-white text-sm font-semibold border border-white/20 hover:bg-white/15 transition"
                  >
                    Change Image
                  </button>
                )}
              </div>
            </div>

            {/* Image Preview */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    Image Preview
                  </h3>
                  <button
                    onClick={resetAnalysis}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4 text-red-200" />
                  </button>
                </div>
                <img
                  src={preview}
                  alt="preview"
                  className="w-full max-h-64 object-contain rounded-lg border border-white/10"
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={loading || !image}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-700 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Satellite className="w-5 h-5" />
                    Detect Debris
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {result?.error ? (
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 border border-red-500/30 rounded-lg p-6 backdrop-blur-lg">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-200">Analysis Failed</h3>
                </div>
                <p className="text-red-100">{result.message}</p>
              </div>
            ) : result ? (
              <>
                {/* Detection Results */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Detection Results</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <p className="text-white/60 text-sm mb-1">Debris Count</p>
                      <p className="text-3xl font-bold text-orange-400">
                        {mockResults?.debrisCount || result.debris_count || 0}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <p className="text-white/60 text-sm mb-1">Coverage Area</p>
                      <p className="text-3xl font-bold text-cyan-400">
                        {mockResults?.coveragePercentage?.toFixed(1) || result.coverage_percentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-white/80 text-sm">AI Confidence</span>
                      <span className="text-cyan-400 font-semibold">
                        {mockResults?.confidence?.toFixed(1) || 85.3}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${mockResults?.confidence || 85}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Composition Analysis */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Debris Composition
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockResults?.composition || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {(mockResults?.composition || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockResults?.composition || []}>
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                          <YAxis stroke="rgba(255,255,255,0.5)" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                            formatter={(value) => [`${value}%`, 'Percentage']}
                          />
                          <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Analysis Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Detection Method</span>
                      <span className="text-cyan-400">AI Computer Vision</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Processing Time</span>
                      <span className="text-cyan-400">2.3 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Image Resolution</span>
                      <span className="text-cyan-400">10m/pixel</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Data Source</span>
                      <span className="text-cyan-400">Sentinel-2 Satellite</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg text-center">
                <Satellite className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Ready for Analysis</h3>
                <p className="text-white/60 text-sm">
                  Upload an image to begin AI-powered debris detection and analysis
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DetectionPage;
