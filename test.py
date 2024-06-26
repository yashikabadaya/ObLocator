import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import os
import cv2
import sys
from flask import Flask, request, jsonify
app = Flask(__name__)

with open('/home/final/CodeFunDoServer2/model/Trained_Graphs/merged_frozen_graph_1.pb', 'rb') as f:
	fileContent = f.read()
graph_def = tf.GraphDef()
graph_def.ParseFromString(fileContent)
tf.import_graph_def(graph_def, input_map=None, return_elements=None, name='', op_dict=None, producer_op_list=None)
graph = tf.get_default_graph()
tensors = [n.name for n in tf.get_default_graph().as_graph_def().node]

wtoidx = np.load("/home/final/CodeFunDoServer2/wordmap.npy").tolist()
idxtow = dict(zip(wtoidx.values(), wtoidx.keys()))

# np.save("Dataset/wordmap", wtoidx)
# np.save("Dataset/vocab", vocab)

with open('/home/final/CodeFunDoServer2/model/Decoder/DecoderOutputs.txt', 'r') as fr:
	outputs = fr.read()
	outputs = outputs.split('\n')[:-1]

def IDs_to_Words(ID_batch):
	return [idxtow[word] for IDs in ID_batch for word in IDs]

input_image=None
sentence=None

def get_tensors():
	global input_image, sentence
	input_image = graph.get_tensor_by_name("encoder/import/InputImage:0")
	sentence = []
	for i,outs in enumerate(outputs):
		sentence.append(graph.get_tensor_by_name("decoder/"+outs+":0"))

def init_caption_generator():
	sess = tf.Session()
	get_tensors()
	return sess

def preprocess_image(img):
	img = cv2.resize(img, (299, 299))
	norm_image = np.empty_like(img)
	norm_image = cv2.normalize(img, norm_image, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_32F)
	norm_image = np.reshape(norm_image, [1,299,299,3])
	return norm_image

def generate_caption(sess, image):
	global input_image, sentence
	
	prepro_image = preprocess_image(image)

	feed_dict = {input_image:prepro_image}
	prob = sess.run(sentence, feed_dict=feed_dict)

	caption = " ".join(IDs_to_Words(prob)).split("</S>")[0]

	return caption

sess = init_caption_generator()

@app.route('/get_caption', methods=['POST'])
def get_caption():
	global sess
	image = cv2.imread(request.form['path'])
	result = generate_caption(sess, image)
	return jsonify(result)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=7990)
