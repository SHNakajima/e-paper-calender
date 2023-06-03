import cv2
import numpy as np
 
img = cv2.imread('./out/image.png', -1)                       # -1はAlphaを含んだ形式(0:グレー, 1:カラー)
lower = np.array([0, 0, 0])                 # 抽出する色の下限(BGR形式)
upper = np.array([0, 0, 50])                 # 抽出する色の上限(BGR形式)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV) # 画像をHSV色空間に変換
img_mask = cv2.inRange(hsv, lower, upper)  # inRangeで元画像を２値化
# img_mask = cv2.inRange(img, color_lower, color_upper)    # 範囲からマスク画像を作成
img_bool = cv2.bitwise_not(img, img, mask=img_mask)      # 元画像とマスク画像の演算(背景を白くする)
cv2.imwrite('./out/transparent.png', img_bool)

