import cv2
import numpy as np

# 元画像の読み込み
path = "./out/image.png"
src = cv2.imread(path)

# Point 1: 暗い部分に対応するマスク画像を生成
mask = np.all(src[:, :, :] < [50, 50, 50], axis=-1)

# Point 2: 元画像をBGR形式からBGRA形式に変換
dst = cv2.cvtColor(src, cv2.COLOR_BGR2BGRA)

# Point 3: マスク画像をもとに、暗い部分を滑らかに半透明化
alpha = np.where(mask, 128, 255)
blur = cv2.GaussianBlur(alpha.astype(np.uint8), (0, 0), sigmaX=2, sigmaY=2)
dst[:, :, 3] = blur

# png画像として出力
cv2.imwrite("./out/image_transparent.png", dst)
