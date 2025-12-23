from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import io
from PIL import Image
import torchvision.transforms as transforms
from model import UNet
import base64
from io import BytesIO
app = Flask(__name__)
CORS(app)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = UNet() 
model.load_state_dict(torch.load('unet_model.pth', map_location=device))
model.eval()

def process_img(img_bytes):
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.485, 0.485], [0.229, 0.229, 0.229]),
    ])
    image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    return transform(image).unsqueeze(0).to(device)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['file']
        img_bytes = file.read()
        tensor = process_img(img_bytes)
        
        with torch.no_grad():
            output = model(tensor) # Forward Propagation
            mask = torch.argmax(output, dim=1).squeeze().cpu().numpy()
            
            mask_img = Image.fromarray((mask * 255).astype('uint8'))
            
            buffered = BytesIO()
            mask_img.save(buffered, format="PNG")
            mask_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        return jsonify({
            'success': True,
            'mask': mask_base64,
            'message': 'Сегментация выполнена'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(port=5000)

